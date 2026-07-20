using Application.Features.Dms.Commands.OpenDm;
using Application.Features.Dms.Queries.GetDms;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("api/dms")]
    [ApiController]
    [Authorize]
    public class DmsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public DmsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetDms()
        {
            var dms = await _mediator.Send(new GetDmsQuery());
            return Ok(dms);
        }

        [HttpPost("{friendUserId:guid}")]
        public async Task<IActionResult> OpenDm(Guid friendUserId)
        {
            try
            {
                var result = await _mediator.Send(new OpenDmCommand
                {
                    FriendUserId = friendUserId
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
