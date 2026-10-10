# BEEF Kart — sadakat uygulaması demosu

> **Bu bir tasarım prototipidir, gerçek BEEF uygulaması değildir.**
> Sunucu, veritabanı, SMS, ödeme veya kasa bağlantısı yoktur. Girilen bilgiler hiçbir yere gönderilmez; yalnızca kullandığınız tarayıcının yerel deposunda (localStorage) tutulur. Tüm müşteri, personel ve işlem kayıtları uydurma örnek verilerdir.

## Neler var?

**Müşteri uygulaması** (`#/app`, mobil öncelikli)
Kayıt (demo doğrulama kodu: `123456`), dijital damga kartı, QR kod ekranı, ödüller, işlem geçmişi, profil.

**İşletme paneli** (`#/panel`)
Kasa (QR okutma simülasyonu, damga verme, ödül kullandırma), genel bakış, müşteriler, sadakat işlemleri, kampanya ve ödül ayarları, şubeler ve personel. Sol alttaki "Oturum (demo)" menüsünden Personel / Şube müdürü / Yönetici rolleri arasında geçiş yapılabilir.

**Deneme önerisi:** Müşteri uygulamasını ve paneli aynı tarayıcıda iki ayrı sekmede açın. Panelde verdiğiniz damga, müşteri kartında anında görünür. Farklı cihazlar veya kişiler aynı veriyi paylaşmaz; herkes kendi örnek verisiyle başlar. Profil › "Demoyu sıfırla" ile başa dönebilirsiniz.

Program kuralları (ör. 10 damga = 1 burger menü) henüz kesinleşmemiştir ve panelden değiştirilebilir.

## Yerelde çalıştırma

Node.js 20 veya üzeri gerekir.

```
npm install
npm run dev
```

Windows'ta `baslat.cmd` dosyası da kullanılabilir. Derleme: `npm run build` (çıktı `dist/` klasörüne yazılır; göreli yollar sayesinde herhangi bir alt dizinden sunulabilir).

## Teknoloji

React · TypeScript · Vite · Tailwind CSS · `qrcode` · `lucide-react`. Yazı tipleri Google Fonts üzerinden yüklenir.

## Haklar

Logo ve fotoğraflar (`public/brand/`) BEEF Burger'a aittir ve yalnızca bu demoda kullanılmaktadır; başka amaçla kullanılamaz. Bu depodaki kod için açık kaynak lisansı verilmemiştir; tüm hakları saklıdır.
