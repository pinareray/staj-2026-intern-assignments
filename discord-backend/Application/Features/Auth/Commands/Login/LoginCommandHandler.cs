using Application.Repositories;
using Application.Security; // ITokenHelper ve HashingHelper için
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Auth.Commands.Login
{
    public class LoginCommandHandler : IRequestHandler<LoginCommand, string>
    {
        private readonly IUserRepository _userRepository;
        private readonly ITokenHelper _tokenHelper;

        // Aşçıya kullanacağı aletleri (Veri tabanı işçisi ve Token fabrikası) veriyoruz.
        public LoginCommandHandler(IUserRepository userRepository, ITokenHelper tokenHelper)
        {
            _userRepository = userRepository;
            _tokenHelper = tokenHelper;
        }

        public async Task<string> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            // 1. Veri tabanında bu e-postaya sahip kullanıcı var mı?
            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            // 2. Şifre Doğru mu? (HashingHelper'ı kullanıyoruz)
            if (!HashingHelper.VerifyPasswordHash(request.Password, user.PasswordHash, user.PasswordSalt))
            {
                throw new Exception("Şifre hatalı.");
            }

            // 3. Her şey doğruysa, JWT (Kimlik Kartı) üret ve Garsona (API'ye) geri gönder.
            var token = _tokenHelper.CreateToken(user);
            
            return token;
        }
    }
}