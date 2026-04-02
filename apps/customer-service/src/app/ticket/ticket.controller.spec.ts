import { TicketController } from './ticket.controller';
import { TicketService, Ticket } from './ticket.service';

describe('TicketController', () => {
  let controller: TicketController;
  let service: TicketService;

  const mockTicket: Ticket = {
    id: 'ticket-1',
    subject: 'Test',
    description: 'Desc',
    customerId: 'cust-1',
    status: 'open',
    priority: 'medium',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = {
      create: jest.fn().mockResolvedValue(mockTicket),
      findAll: jest.fn().mockResolvedValue([mockTicket]),
      findById: jest.fn().mockResolvedValue(mockTicket),
      update: jest.fn().mockResolvedValue({ ...mockTicket, subject: 'Updated' }),
    } as unknown as TicketService;

    controller = new TicketController(service);
  });

  it('should create a ticket', async () => {
    const result = await controller.create({
      subject: 'Test',
      description: 'Desc',
      customerId: 'cust-1',
    });
    expect(result).toEqual(mockTicket);
    expect(service.create).toHaveBeenCalled();
  });

  it('should return all tickets', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([mockTicket]);
  });

  it('should return ticket by id', async () => {
    const result = await controller.findById('ticket-1');
    expect(result).toEqual(mockTicket);
    expect(service.findById).toHaveBeenCalledWith('ticket-1');
  });

  it('should update a ticket', async () => {
    const result = await controller.update('ticket-1', { subject: 'Updated' });
    expect(result.subject).toBe('Updated');
    expect(service.update).toHaveBeenCalledWith('ticket-1', { subject: 'Updated' });
  });
});
