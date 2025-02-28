# 🛍️ Alışveriş Sitesi Backend

Bu proje, **Alışveriş Sitesi Backend API'sini** geliştirmek için oluşturulmuştur.  
Node.js, Express ve **Prisma ORM** kullanılarak inşa edilmiştir.

---

## 📌 Özellikler
- RESTful API Desteği
- Kullanıcı Kimlik Doğrulama (JWT ile)
- Ürün Yönetimi (Ekleme, Güncelleme, Silme)
- Sipariş İşlemleri
- Prisma ORM ile **PostgreSQL / MySQL / SQLite** desteği

---

## 🛠 Kurulum & Çalıştırma
Projeyi başlatmak için aşağıdaki adımları takip edin:

### 1️⃣ Projeyi Klonlayın
```bash
git clone https://github.com/dnzilkay/Alisveris-Sitem-Backend.git
cd Alisveris-Sitem-Backend
```
### 2️⃣ Bağımlılıkları Kurun
```bash
npm install  # veya yarn install
```

### 3️⃣ Çevresel Değişkenleri Ayarlayın
Projenin .env dosyasını oluşturun ve aşağıdaki değişkenleri ekleyin:
```dotenv
DATABASE_URL="postgresql://kullanici:şifre@localhost:5432/veritabani_adı"
```
## 🗄 Veritabanı Kurulumu
Bu projede Prisma ORM kullanıldığı için, veritabanını başlatmak için şu komutları çalıştırın:
```bash
prisma generate
```
Veritabanı modellerini görmek için:

```bash
npx prisma studio
```

## 🎮 Geliştirme Ortamında Çalıştırma
Geliştirme ortamında çalıştırmak için:

```bash
npm run dev  # veya yarn dev
```
Üretim için:
```bash
npm run start  # veya yarn start
```

