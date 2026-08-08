import API from "../api/axios";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";

export const normalizePhoneDigits = (phone) => phone.replace(/\D/g, "").slice(-10);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

const otpProviderPreference = (import.meta.env.VITE_OTP_PROVIDER || "auto")
  .toString()
  .trim()
  .toLowerCase();

const recaptchaMode = (import.meta.env.VITE_FIREBASE_RECAPTCHA_MODE || "visible")
  .toString()
  .trim()
  .toLowerCase();

const useInvisibleRecaptcha = recaptchaMode === "invisible";

const isFirebaseConfigured = missingFirebaseConfig.length === 0;

const firebaseApp = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

const auth = firebaseApp ? getAuth(firebaseApp) : null;
if (auth) {
  auth.languageCode = "en";
}

let activeVerifier = null;
let activeRecaptchaContainerId = "";

const formatFirebasePhone = (phone) => {
  const digits = normalizePhoneDigits(phone);
  if (digits.length !== 10) {
    throw createOtpError("Enter a valid 10-digit mobile number.");
  }

  return `+91${digits}`;
};

function createOtpError(message, cause) {
  const error = new Error(message);
  error.response = {
    data: {
      detail: message,
    },
  };
  if (cause) {
    error.cause = cause;
  }
  return error;
}

function ensureFirebaseConfigured() {
  if (!auth || missingFirebaseConfig.length > 0) {
    throw createOtpError("Firebase OTP is not configured in the frontend environment.");
  }
}

function clearRecaptchaVerifier() {
  if (activeVerifier) {
    activeVerifier.clear();
    activeVerifier = null;
  }

  activeRecaptchaContainerId = "";
}

function createRecaptchaVerifier(containerId) {
  ensureFirebaseConfigured();

  const container = document.getElementById(containerId);
  if (!container) {
    throw createOtpError("OTP verification UI is not ready. Refresh the page and try again.");
  }

  if (activeVerifier && activeRecaptchaContainerId === containerId) {
    return activeVerifier;
  }

  if (activeVerifier && activeRecaptchaContainerId !== containerId) {
    clearRecaptchaVerifier();
  }

  container.style.position = container.style.position || "relative";

  const mountId = `${containerId}-firebase-recaptcha-host`;
  let mountNode = document.getElementById(mountId);
  if (!mountNode) {
    mountNode = document.createElement("div");
    mountNode.id = mountId;
    container.appendChild(mountNode);
  }

  if (useInvisibleRecaptcha) {
    mountNode.style.position = "fixed";
    mountNode.style.left = "-10000px";
    mountNode.style.top = "0";
    mountNode.style.width = "1px";
    mountNode.style.height = "1px";
    mountNode.style.opacity = "0";
    mountNode.style.pointerEvents = "none";
    mountNode.style.overflow = "hidden";
  } else {
    mountNode.style.position = "static";
    mountNode.style.left = "";
    mountNode.style.top = "";
    mountNode.style.width = "auto";
    mountNode.style.height = "auto";
    mountNode.style.opacity = "1";
    mountNode.style.pointerEvents = "auto";
    mountNode.style.overflow = "visible";
  }
  mountNode.innerHTML = "";

  activeVerifier = new RecaptchaVerifier(auth, mountNode, {
    size: useInvisibleRecaptcha ? "invisible" : "normal",
  });
  activeRecaptchaContainerId = containerId;

  return activeVerifier;
}

export const prepareOtpRecaptcha = (containerId) => {
  if (!isFirebaseConfigured || otpProviderPreference === "backend") {
    return null;
  }

  return createRecaptchaVerifier(containerId);
};

function mapFirebaseError(error, fallbackMessage) {
  const code = error?.code;

  if (code === "auth/invalid-phone-number") {
    return "Enter a valid mobile number with an active SIM.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many OTP attempts. Please wait a few minutes and try again.";
  }
  if (code === "auth/invalid-verification-code") {
    return "OTP not match";
  }
  if (code === "auth/code-expired") {
    return "OTP expired. Request a new OTP.";
  }
  if (code === "auth/captcha-check-failed") {
    return "reCAPTCHA validation failed. Please try again.";
  }
  if (code === "auth/billing-not-enabled") {
    return "Firebase billing is not enabled for phone authentication.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Firebase phone authentication is not enabled for this project.";
  }
  if (code === "auth/quota-exceeded") {
    return "Firebase OTP quota exceeded. Try again later or upgrade plan limits.";
  }
  if (code === "auth/missing-client-identifier") {
    return "App verification failed. Make sure this domain/app is allowed in Firebase Auth settings.";
  }
  if (code === "auth/app-not-authorized") {
    return "This app/domain is not authorized for Firebase Auth. Add it to Authorized domains.";
  }
  if (code === "auth/internal-error") {
    return "Firebase returned an internal error. Try again in a minute.";
  }

  if (typeof code === "string" && code.trim()) {
    const providerMessage =
      typeof error?.message === "string" && error.message.trim()
        ? ` ${error.message.trim()}`
        : "";
    return `${fallbackMessage} (${code})${providerMessage}`;
  }

  return fallbackMessage;
}

function getFirebaseFailureDetails(error) {
  const errorCode =
    typeof error?.code === "string" && error.code.trim() ? error.code.trim() : "";
  if (errorCode) {
    return errorCode;
  }

  const errorMessage =
    typeof error?.message === "string" && error.message.trim()
      ? error.message.trim()
      : "";
  if (errorMessage) {
    return errorMessage;
  }

  const providerMessage =
    typeof error?.customData?._tokenResponse?.error?.message === "string" &&
    error.customData._tokenResponse.error.message.trim()
      ? error.customData._tokenResponse.error.message.trim()
      : "";

  return providerMessage || "unknown error";
}

export const sendOtpToPhoneNumber = async (phone, recaptchaContainerId) => {
  const normalizedPhone = normalizePhoneDigits(phone);

  if (normalizedPhone.length !== 10) {
    throw createOtpError("Enter a valid 10-digit mobile number.");
  }

  const sendOtpUsingBackend = async () => {
    const response = await API.post("/auth/otp/send", {
      mobile: normalizedPhone,
    });

    const requestId =
      typeof response?.data?.request_id === "string" && response.data.request_id.trim()
        ? response.data.request_id.trim()
        : "";
    const providerType =
      typeof response?.data?.provider_type === "string" && response.data.provider_type.trim()
        ? response.data.provider_type.trim()
        : "";
    const backendMessage =
      response?.data?.message || "OTP sent via backend provider. Enter the 6-digit code.";
    const traceMeta = [providerType && `status:${providerType}`, requestId && `request:${requestId}`]
      .filter(Boolean)
      .join(" | ");

    return {
      confirmationResult: null,
      provider: "backend",
      message: traceMeta ? `${backendMessage} (${traceMeta})` : backendMessage,
    };
  };

  if (otpProviderPreference === "backend") {
    try {
      return await sendOtpUsingBackend();
    } catch (error) {
      throw createOtpError(
        error?.response?.data?.detail || "Unable to send OTP. Please try again.",
        error
      );
    }
  }

  if (otpProviderPreference === "firebase") {
    ensureFirebaseConfigured();

    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formatFirebasePhone(normalizedPhone),
        createRecaptchaVerifier(recaptchaContainerId)
      );

      return {
        confirmationResult,
        provider: "firebase",
        message: "OTP sent via Firebase. Enter the 6-digit code.",
      };
    } catch (error) {
      console.error("Firebase send OTP error", {
        code: error?.code,
        message: error?.message,
      });
      throw createOtpError(
        mapFirebaseError(error, "Unable to send OTP via Firebase. Please try again."),
        error
      );
    }
  }

  if (!isFirebaseConfigured) {
    try {
      return await sendOtpUsingBackend();
    } catch (error) {
      throw createOtpError(
        error?.response?.data?.detail || "Unable to send OTP. Please try again.",
        error
      );
    }
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      formatFirebasePhone(normalizedPhone),
      createRecaptchaVerifier(recaptchaContainerId)
    );

    return {
      confirmationResult,
      provider: "firebase",
      message: "OTP sent via Firebase. Enter the 6-digit code.",
    };
  } catch (error) {
    console.error("Firebase send OTP error", {
      code: error?.code,
      message: error?.message,
    });

    try {
      const backendFallback = await sendOtpUsingBackend();
      return {
        ...backendFallback,
        message: `Firebase OTP failed (${getFirebaseFailureDetails(error)}). OTP sent via backend provider. Enter the 6-digit code.`,
      };
    } catch (fallbackError) {
      throw createOtpError(
        fallbackError?.response?.data?.detail ||
          mapFirebaseError(error, "Unable to send OTP. Please try again."),
        fallbackError
      );
    }
  }
};

export const verifyOtpCode = async (phone, otp, confirmationResult) => {
  const normalizedPhone = normalizePhoneDigits(phone);
  const trimmedOtp = otp.trim();

  if (normalizedPhone.length !== 10) {
    throw createOtpError("Enter a valid 10-digit mobile number.");
  }

  if (trimmedOtp.length !== 6) {
    throw createOtpError("Enter the 6-digit OTP.");
  }

  if (!confirmationResult) {
    if (otpProviderPreference === "firebase") {
      throw createOtpError("Request OTP via Firebase first.");
    }

    try {
      const response = await API.post("/auth/otp/verify", {
        mobile: normalizedPhone,
        otp: trimmedOtp,
      });

      return response.data;
    } catch (error) {
      throw createOtpError(
        error?.response?.data?.detail || "OTP verification failed.",
        error
      );
    }
  }

  try {
    const credential = await confirmationResult.confirm(trimmedOtp);
    const firebaseIdToken = await credential.user.getIdToken(true);
    const response = await API.post("/auth/otp/firebase/verify", {
      mobile: normalizedPhone,
      firebase_id_token: firebaseIdToken,
    });

    await signOut(auth).catch(() => {});
    clearRecaptchaVerifier();
    return response.data;
  } catch (error) {
    console.error("Firebase verify OTP error", {
      code: error?.code,
      message: error?.message,
    });
    throw createOtpError(
      mapFirebaseError(error, "OTP verification failed."),
      error
    );
  }
};

export const resetOtpProviderState = async () => {
  clearRecaptchaVerifier();
  await signOut(auth).catch(() => {});
};