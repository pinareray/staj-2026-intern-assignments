using System;

namespace Domain.Entities
{
    public class User
    {
        //Bu sınıf, veri tabanımızdaki "Kullanıcılar" tablosunun tam karşılığı olacak.
        // Neden Guid? İleride veritabanlarını ayırmamız veya birleştirmemiz gerekirse, 
        // 1, 2, 3 gibi sıralı ID'ler çakışır. Guid (uzun karmaşık metin) evrensel olarak benzersizdir.
        public Guid Id { get; set; } 
        public string Email { get; set; }
        public string Username { get; set; }

        // Neden string Password tutmuyoruz?
        // Hiçbir güvenli sistem şifreyi veri tabanında "123456" diye düz metin tutmaz.
        // PasswordHash: Şifrenin kriptografik olarak çırpılmış, geri döndürülemez halidir.
        // PasswordSalt: İki kişinin şifresi "123456" olsa bile, veritabanında farklı görünmesi 
        // için şifrenin sonuna eklenen rastgele bir tuz değeridir.
        public byte[] PasswordHash { get; set; }
        public byte[] PasswordSalt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}