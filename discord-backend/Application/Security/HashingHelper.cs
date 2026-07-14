using System.Text;

namespace Application.Security
{
    public static class HashingHelper
    {
        // Yeni kayıt sırasında rastgele bir Salt üretir ve şifreyi HMACSHA512 ile hashler.
        public static void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using (var hmac = new System.Security.Cryptography.HMACSHA512())
            {
                passwordSalt = hmac.Key;
                passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            }
        }

        // Discord'un yaptığı gibi, kullanıcının girdiği düz şifreyi (örneğin "123456"), 
        // veri tabanındaki tuz (Salt) ile tekrar çırpıyoruz. Eğer sonuç, veri tabanındaki 
        // Hash ile aynı çıkarsa "Şifre doğru" diyoruz.
        public static bool VerifyPasswordHash(string password, byte[] passwordHash, byte[] passwordSalt)
        {
            using (var hmac = new System.Security.Cryptography.HMACSHA512(passwordSalt))
            {
                var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
                for (int i = 0; i < computedHash.Length; i++)
                {
                    if (computedHash[i] != passwordHash[i])
                    {
                        return false; // Şifre yanlış
                    }
                }
                return true; // Şifre doğru
            }
        }
    }
}