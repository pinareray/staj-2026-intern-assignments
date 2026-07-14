using Application.Features.Messages.Commands.SendMessage;
using Application.Features.Messages.Queries.GetMessagesByChannel;
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
    public class MessagesController : ControllerBase
    {
        private readonly IMediator _mediator;

        public MessagesController(IMediator mediator)
        {
            _mediator = mediator;
        }

        // GET api/messages?channelId=...
        [HttpGet]
        public async Task<IActionResult> GetByChannelQuery([FromQuery] Guid channelId)
        {
            var messages = await _mediator.Send(new GetMessagesByChannelQuery
            {
                ChannelId = channelId
            });
            return Ok(messages);
        }

        // GET api/messages/{channelId}
        [HttpGet("{channelId:guid}")]
        public async Task<IActionResult> GetByChannel(Guid channelId)
        {
            var messages = await _mediator.Send(new GetMessagesByChannelQuery
            {
                ChannelId = channelId
            });
            return Ok(messages);
        }

        [HttpPost]
        public async Task<IActionResult> Send([FromBody] SendMessageDto dto)
        {
            var message = await _mediator.Send(new SendMessageCommand
            {
                ChannelId = dto.ChannelId,
                Content = dto.Content,
                UserId = dto.SenderId
            });
            return Ok(message);
        }
    }
}
