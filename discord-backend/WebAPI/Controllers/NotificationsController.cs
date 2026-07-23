using Application.Features.Notifications.Commands.MarkAllNotificationsRead;
using Application.Features.Notifications.Commands.MarkNotificationRead;
using Application.Features.Notifications.Queries.GetNotifications;
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
    public class NotificationsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public NotificationsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await _mediator.Send(new GetNotificationsQuery());
            return Ok(result);
        }

        [HttpPost("{id:guid}/read")]
        public async Task<IActionResult> MarkRead(Guid id)
        {
            try
            {
                var result = await _mediator.Send(new MarkNotificationReadCommand
                {
                    NotificationId = id
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            var result = await _mediator.Send(new MarkAllNotificationsReadCommand());
            return Ok(result);
        }
    }
}
