using Application.Features.Users.Commands.ChangePassword;
using Application.Features.Users.Commands.UpdateProfile;
using Application.Features.Users.Queries.GetProfile;
using Application.Features.Users.Queries.GetUserByUsername;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IMediator _mediator;

        public UsersController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetProfile()
        {
            var profile = await _mediator.Send(new GetProfileQuery());
            return Ok(profile);
        }

        [HttpGet("{username}")]
        public async Task<IActionResult> GetByUsername(string username)
        {
            try
            {
                var profile = await _mediator.Send(new GetUserByUsernameQuery
                {
                    Username = username
                });
                return Ok(profile);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileCommand command)
        {
            var profile = await _mediator.Send(command);
            return Ok(profile);
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
        {
            await _mediator.Send(command);
            return Ok(new { Message = "Şifre başarıyla güncellendi." });
        }
    }
}
