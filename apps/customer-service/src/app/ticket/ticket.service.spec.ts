import { NotFoundException } from '@nestjs/common';
import { TicketService } from './ticket.service';

describe('TicketService', () => {
  let service: TicketService;

  beforeEach(() => {
    service = new TicketService();
  });

  describe('create', () => {
    it('should create a ticket with default status and priority', async () => {
      const ticket = await service.create({
        subject: 'Test ticket',
        description: 'A test description',
        customerId: 'cust-1',
      });

      expect(ticket.id).toBeDefined();
      expect(ticket.subject).toBe('Test ticket');
      expect(ticket.description).toBe('A test description');
      expect(ticket.customerId).toBe('cust-1');
      expect(ticket.status).toBe('open');
      expect(ticket.priority).toBe('medium');
      expect(ticket.createdAt).toBeInstanceOf(Date);
    });

    it('should use provided priority', async () => {
      const ticket = await service.create({
        subject: 'Urgent',
        description: 'Urgent issue',
        customerId: 'cust-1',
        priority: 'high',
      });

      expect(ticket.priority).toBe('high');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no tickets', async () => {
      const tickets = await service.findAll();
      expect(tickets).toEqual([]);
    });

    it('should return all created tickets', async () => {
      await service.create({ subject: 'T1', description: 'D1', customerId: 'c1' });
      await service.create({ subject: 'T2', description: 'D2', customerId: 'c2' });

      const tickets = await service.findAll();
      expect(tickets).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return ticket by id', async () => {
      const created = await service.create({
        subject: 'Find me',
        description: 'Desc',
        customerId: 'c1',
      });

      const found = await service.findById(created.id);
      expect(found.subject).toBe('Find me');
    });

    it('should throw NotFoundException for unknown id', async () => {
      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update ticket fields', async () => {
      const created = await service.create({
        subject: 'Original',
        description: 'Desc',
        customerId: 'c1',
      });

      const updated = await service.update(created.id, {
        subject: 'Updated',
        status: 'closed',
      });

      expect(updated.subject).toBe('Updated');
      expect(updated.status).toBe('closed');
      expect(updated.description).toBe('Desc');
    });

    it('should throw NotFoundException for unknown id', async () => {
      await expect(
        service.update('nonexistent', { subject: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
