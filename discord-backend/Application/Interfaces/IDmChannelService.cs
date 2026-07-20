using Domain.Entities;
using System;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IDmChannelService
    {
        /// <summary>
        /// Finds an existing DM between two users or creates one with both as members.
        /// When created and seedGreeting is true, inserts a "Merhaba" message from greetingFromUserId.
        /// </summary>
        Task<Channel> FindOrCreateDmAsync(
            Guid userA,
            Guid userB,
            bool seedGreeting = false,
            Guid? greetingFromUserId = null);
    }
}
