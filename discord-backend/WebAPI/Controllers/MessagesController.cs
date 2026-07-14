using Application.Features.Messages.Commands.SendMessage;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MessagesController : ControllerBase
    {
        private readonly IMediator _mediator;

        public MessagesController(IMediator mediator)
        {
            _mediator = mediator;
        }

        // POST api/messages
        [HttpPost]
        public async Task<IActionResult> Send([FromBody] SendMessageCommand command)
        {
            var message = await _mediator.Send(command);
            return Ok(message);
        }
    }
}
