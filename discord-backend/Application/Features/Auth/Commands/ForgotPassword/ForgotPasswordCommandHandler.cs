using Application.Repositories;
using MediatR;
using System;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Auth.Commands.ForgotPassword
{
    public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, string>
    {
        private readonly IUserRepository _userRepository;

        public ForgotPasswordCommandHandler(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<string> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
        {
            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user == null)
            {
                throw new Exception("Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.");
            }

            // 64 karakterlik kriptografik rastgele token (32 byte → hex).
            var resetToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

            user.PasswordResetToken = resetToken;
            user.ResetTokenExpires = DateTime.UtcNow.AddMinutes(15);

            await _userRepository.UpdateAsync(user);

            // MVP/test: e-posta göndermek yerine token'ı API yanıtında dönüyoruz.
            return resetToken;
        }
    }
}
