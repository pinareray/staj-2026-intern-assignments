using Application.Repositories;
using Application.Security;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Auth.Commands.ResetPassword
{
    public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, bool>
    {
        private readonly IUserRepository _userRepository;

        public ResetPasswordCommandHandler(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<bool> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
            {
                throw new Exception("Token ve yeni şifre zorunludur.");
            }

            var user = await _userRepository.GetByResetTokenAsync(request.Token);
            if (user == null)
            {
                throw new Exception("Geçersiz veya kullanılmış şifre sıfırlama token'ı.");
            }

            if (!user.ResetTokenExpires.HasValue || user.ResetTokenExpires.Value < DateTime.UtcNow)
            {
                throw new Exception("Şifre sıfırlama token'ının süresi dolmuş. Lütfen yeniden talep edin.");
            }

            HashingHelper.CreatePasswordHash(request.NewPassword, out byte[] passwordHash, out byte[] passwordSalt);
            user.PasswordHash = passwordHash;
            user.PasswordSalt = passwordSalt;

            // Token tek kullanımlık: temizle.
            user.PasswordResetToken = null;
            user.ResetTokenExpires = null;

            await _userRepository.UpdateAsync(user);
            return true;
        }
    }
}
