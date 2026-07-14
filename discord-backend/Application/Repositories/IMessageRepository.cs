using Domain.Entities;
using System;
using System.Threading.Tasks;

namespace Application.Repositories
{
    public interface IMessageRepository
    {
        Task AddAsync(Message message);
    }
}
