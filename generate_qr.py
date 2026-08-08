import os
import qrcode

url = 'exp://192.168.1.7:8081'
out_path = r'D:\backup\OneDrive\Desktop\Medvo\qr_code_expo.png'
img = qrcode.make(url)
img.save(out_path)
print(out_path)

