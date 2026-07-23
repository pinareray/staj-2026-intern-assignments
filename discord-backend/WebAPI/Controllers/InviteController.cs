using Application.Features.Servers.Commands.JoinByInviteCode;
using Application.Features.Servers.Queries.GetInviteByCode;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("api/invite")]
    [ApiController]
    public class InviteController : ControllerBase
    {
        private readonly IMediator _mediator;

        public InviteController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>Davet önizlemesi — giriş zorunlu değil; token varsa üyelik bilgisi döner.</summary>
        [AllowAnonymous]
        [HttpGet("{code}")]
        public async Task<IActionResult> Preview(string code)
        {
            try
            {
                var result = await _mediator.Send(new GetInviteByCodeQuery { Code = code });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("{code}/join")]
        public async Task<IActionResult> Join(string code)
        {
            try
            {
                var result = await _mediator.Send(new JoinByInviteCodeCommand { Code = code });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
