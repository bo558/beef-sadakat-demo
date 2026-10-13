# THE BEEF Kart — sadakat uygulaması demosu

> **Bu bir tasarım prototipidir, gerçek THE BEEF uygulaması değildir.**
> Sunucu, veritabanı, SMS veya kasa bağlantısı yoktur. Girilen bilgiler hiçbir yere gönderilmez; yalnızca kullandığınız tarayıcının yerel deposunda (localStorage) tutulur. Tüm müşteri, personel ve işlem kayıtları uydurma örnek verilerdir.

## Program

Sipariş başına 1 damga · 10 damga = 1 Burger Menü · ödül 90 gün geçerli · damgalar silinmez · hoş geldin damgası yok.

## Ekranlar (5)

| Adres | Ekran | Ne yapılır |
|---|---|---|
| `#/app` | **Giriş** | Telefon → SMS kodu (demo: `123456`) → ad + KVKK onayı. Kayıtlı numara ad sormadan karta gider. |
| `#/app` | **Kartım** | Damga kartı ve QR kod tek ekranda. Ödül hazırsa aynı ekranda görünür; kasada aynı QR okutulur. |
| `#/app` | **Hesap** (alt panel) | Program kuralları, KVKK metni, çıkış, hesabı silme. |
| `#/kasa` | **Kasa** | PIN ile giriş → QR okut ya da 6 haneli yedek kodu gir → tek butonla **+1 damga** ya da **Ödülü kullan** → 10 sn "Geri al" → ekran yeni müşteriye hazır. |
| `#/yonetim` | **Yönetim** (yalnızca yönetici) | Müşteri arama ve gerekçeli damga düzeltme, personel ekleme/erişim kapatma, program ayarı (damga sayısı ve ödül adı), işlem kaydı. |

Demo PIN'leri: Can D. `1111`, Selin T. `2222` (kasa personeli), Ayşe K. `9999` (yönetici). Emre Y. `3333` erişimi kapalı örnek personeldir.

## Korunan kontroller

- **Tek QR, dakikada bir değişir.** Kasa yalnızca güncel (ya da bir önceki dakikanın) kodunu kabul eder. Kasada telefonla müşteri araması yoktur.
- **Tekrar damga engeli:** aynı müşteriye 120 dk içinde ikinci damga verilmez.
- **Ödül tek kullanımlık:** kullanılan ödül ikinci kez kullanılamaz; süresi dolan ödül reddedilir.
- **Geri alma:** kasada yalnızca 10 sn içinde. Kartı dolduran damga geri alınırsa açılan ödül de iptal olur; kullanılmış ödülü açan damga geri alınamaz. Sonraki düzeltmeleri yalnızca yönetici, gerekçe seçerek yapar.
- **İşlem kaydı:** her damga, geri alma, ödül kullanımı, düzeltme, program ve personel değişikliği kim/ne zaman bilgisiyle kaydedilir. Damga defteri silinmez; düzeltmeler ters kayıtla yapılır.

### Demoda gerçekten güvenli olmayanlar

Bu kontroller demoda **tarayıcıda** çalışır ve tek başına güvenlik sağlamaz. Gerçek sürümde hepsinin sunucuda yapılması gerekir:

- QR kodu herkesin görebileceği basit bir özetle üretilir; gerçek sürümde sunucunun gizli anahtarıyla imzalanmalıdır.
- PIN'ler tarayıcıda düz metin tutulur ve giriş ekranında yazılıdır; gerçek sürümde sunucuda özetlenerek saklanmalıdır.
- SMS gönderilmez; kod her zaman `123456`'dır.
- Kasada kamera bağlı değildir; "kameraya gösterilen QR" listesi okutmayı canlandırır (okunan içerik yine kod çözümlemesinden geçer). Yedek kod girişi gerçek şekilde çalışır.
- Veri cihazlar arasında paylaşılmaz; müşteri uygulamasını ve kasayı **aynı tarayıcıda iki sekmede** açın, değişiklikler anında senkron olur.
- Demo kısayolları ("+1 damga", "Kartı doldur") bekleme süresini atlar ve işlem kaydına "Demo kısayolu" olarak yazılır. Kasadaki demo menüsünden bekleme süresi kapatılabilir.

## Yerelde çalıştırma

Node.js 20 veya üzeri gerekir.

```
npm install
npm run dev
```

Windows'ta `baslat.cmd` dosyası da kullanılabilir (http://127.0.0.1:5173/). Derleme: `npm run build` (çıktı `dist/`; göreli yollar sayesinde herhangi bir alt dizinden sunulabilir).


## Teknoloji

React · TypeScript · Vite · Tailwind CSS · `qrcode` · `lucide-react`. Yazı tipleri (Anton, Poppins) Google Fonts üzerinden yüklenir.

## Haklar

Logo ve fotoğraflar THE BEEF · burger & more'a (@thebeef.burger) aittir ve yalnızca bu demoda kullanılmaktadır; başka amaçla kullanılamaz. Bu depodaki kod için açık kaynak lisansı verilmemiştir; tüm hakları saklıdır.
