using Application.Features.Auth.Commands.Login;
using Application.Features.Auth.Commands.Register;
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

        // Şef Garsonu (MediatR) içeri alıyoruz.
        public AuthController(IMediator mediator)
        {
            _mediator = mediator;
        }

        // React Native uygulamamızdan "Giriş Yap" butonuna basıldığında bu metot tetiklenecek.
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginCommand command)
        {
            // İsteği al, MediatR aracılığıyla mutfağa (LoginCommandHandler) gönder.
            var token = await _mediator.Send(command);

            // Mutfaktan dönen Token'ı 200 OK koduyla telefona geri yolla.
            return Ok(new { Token = token });
        }

        // "Kayıt Ol" isteği: yeni kullanıcı oluşturur ve JWT döner.
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterCommand command)
        {
            var token = await _mediator.Send(command);
            return Ok(new { Token = token });
        }
    }
}