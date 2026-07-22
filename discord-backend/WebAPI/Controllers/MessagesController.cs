using Application.Features.Messages.Commands.DeleteMessage;
using Application.Features.Messages.Commands.EditMessage;
using Application.Features.Messages.Commands.StarMessage;
using Application.Features.Messages.Commands.UnstarMessage;
using Application.Features.Messages.Commands.SendMessage;
using Application.Features.Messages.Queries.GetMessagesByChannel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IWebHostEnvironment _env;

        public MessagesController(IMediator mediator, IWebHostEnvironment env)
        {
            _mediator = mediator;
            _env = env;
        }

        [HttpGet]
        public async Task<IActionResult> GetByChannelQuery([FromQuery] Guid channelId)
        {
            var messages = await _mediator.Send(new GetMessagesByChannelQuery
            {
                ChannelId = channelId
            });
            return Ok(messages);
        }

        [HttpGet("{channelId:guid}")]
        public async Task<IActionResult> GetByChannel(Guid channelId)
        {
            var messages = await _mediator.Send(new GetMessagesByChannelQuery
            {
                ChannelId = channelId
            });
            return Ok(messages);
        }

        [HttpPost("{messageId:guid}/star")]
        public async Task<IActionResult> Star(Guid messageId)
        {
            try
            {
                var result = await _mediator.Send(new StarMessageCommand { MessageId = messageId });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{messageId:guid}/star")]
        public async Task<IActionResult> Unstar(Guid messageId)
        {
            try
            {
                var result = await _mediator.Send(new UnstarMessageCommand { MessageId = messageId });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{messageId:guid}")]
        public async Task<IActionResult> Edit(Guid messageId, [FromBody] EditMessageDto dto)
        {
            try
            {
                var result = await _mediator.Send(new EditMessageCommand
                {
                    MessageId = messageId,
                    Content = dto.Content
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{messageId:guid}")]
        public async Task<IActionResult> Delete(Guid messageId)
        {
            try
            {
                var result = await _mediator.Send(new DeleteMessageCommand { MessageId = messageId });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("upload")]
        [RequestSizeLimit(5_000_000)]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Dosya seçilmedi." });
            }

            var allowed = new[] { ".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf" };
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (Array.IndexOf(allowed, ext) < 0)
            {
                return BadRequest(new { message = "Desteklenmeyen dosya türü." });
            }

            var uploads = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads");
            Directory.CreateDirectory(uploads);
            var fileName = $"{Guid.NewGuid():N}{ext}";
            var path = Path.Combine(uploads, fileName);

            await using (var stream = System.IO.File.Create(path))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
            return Ok(new { url, fileName });
        }

        [HttpPost]
        public async Task<IActionResult> Send([FromBody] SendMessageDto dto)
        {
            var message = await _mediator.Send(new SendMessageCommand
            {
                ChannelId = dto.ChannelId,
                Content = dto.Content ?? "",
                UserId = dto.SenderId,
                AttachmentUrl = dto.AttachmentUrl
            });
            return Ok(message);
        }
    }

    public class EditMessageDto
    {
        public string Content { get; set; } = string.Empty;
    }
}
