using Application.Features.Auth.Commands.ForgotPassword;
using Application.Features.Auth.Commands.Login;
using Application.Features.Auth.Commands.Register;
using Application.Features.Auth.Commands.ResetPassword;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    // api/auth rotasını dinleyen dışa açık kapımız.
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AuthController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginCommand command)
        {
            var token = await _mediator.Send(command);
            return Ok(new { Token = token });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterCommand command)
        {
            var token = await _mediator.Send(command);
            return Ok(new { Token = token });
        }

        // Şifremi unuttum: reset token üretir (MVP'de yanıtta döner).
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordCommand command)
        {
            var resetToken = await _mediator.Send(command);
            return Ok(new { ResetToken = resetToken });
        }

        // Token + yeni şifre ile hesap şifresini günceller.
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordCommand command)
        {
            await _mediator.Send(command);
            return Ok(new { Message = "Şifre başarıyla güncellendi." });
        }
    }
}
