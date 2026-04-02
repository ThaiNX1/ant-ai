import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  customerId: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TicketService {
  private readonly tickets = new Map<string, Ticket>();

  async create(dto: CreateTicketDto): Promise<Ticket> {
    const now = new Date();
    const ticket: Ticket = {
      id: randomUUID(),
      subject: dto.subject,
      description: dto.description,
      customerId: dto.customerId,
      status: 'open',
      priority: dto.priority || 'medium',
      createdAt: now,
      updatedAt: now,
    };
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  async findAll(): Promise<Ticket[]> {
    return Array.from(this.tickets.values());
  }

  async findById(id: string): Promise<Ticket> {
    const ticket = this.tickets.get(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${id} not found`);
    }
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findById(id);
    const updated: Ticket = {
      ...ticket,
      ...Object.fromEntries(
        Object.entries(dto).filter(([, v]) => v !== undefined),
      ),
      updatedAt: new Date(),
    };
    this.tickets.set(id, updated);
    return updated;
  }
}
