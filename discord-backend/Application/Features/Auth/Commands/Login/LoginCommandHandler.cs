using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
//Şimdi uygulamanın asıl beynine, yani gelen giriş yapma isteğini işleyecek yere geldik. Bütün mantık burada çalışır.
namespace Application.Features.Auth.Commands.Login
{
    // IRequestHandler: "Ben LoginCommand paketlerini alır, geriye string dönerim" der.
    public class LoginCommandHandler : IRequestHandler<LoginCommand, string>
    {
        // Sadece sözleşmeleri (Interface) çağırıyoruz. Gerçek veri tabanı kodları burada yok.
        private readonly IUserRepository _userRepository;

        // Constructor Injection: .NET bu sınıfı çalıştırdığında, içine IUserRepository'nin 
        // dolu halini (ileride yazacağımız Supabase kodlarını) otomatik enjekte edecek.
        public LoginCommandHandler(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<string> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            // 1. Veri tabanında bu e-postaya sahip bir kullanıcı var mı diye bak.
            var user = await _userRepository.GetByEmailAsync(request.Email);
            
            // Eğer yoksa giriş başarısızdır. Hata fırlat.
            if (user == null)
            {
                throw new Exception("Kullanıcı bulunamadı veya şifre hatalı.");
            }

            // 2. ŞİFRE KONTROLÜ (Bunu bir sonraki adımda Helper sınıfı ile yazacağız)
            // Gelen düz şifreyi alıp, veritabanındaki Salt ile çırpıp, Hash ile aynı mı diye bakacağız.

            // 3. TOKEN ÜRETİMİ (Bunu da bir sonraki adımda JwtHelper ile yazacağız)
            // Eğer şifre doğruysa, Pınar'ın bilgilerini içeren şifreli bir JWT üretip döneceğiz.

            return "Buraya_Gecerli_Bir_JWT_Gelecek";
        }
    }
}