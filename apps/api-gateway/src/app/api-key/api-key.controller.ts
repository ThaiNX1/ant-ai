import {
  Controller, Post, Get, Patch, Delete,
  Body, Param, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { RootApiKeyGuard } from '@ai-platform/common';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

@UseGuards(RootApiKeyGuard)
@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly service: ApiKeyService) {}

  @Post()
  async create(@Body() dto: CreateApiKeyDto) {
    const { raw, prefix, entity } = await this.service.create(dto);
    return {
      // raw key shown ONCE — client must save it
      key: raw,
      id: entity.id,
      prefix,
      userId: entity.userId,
      name: entity.name,
      services: entity.services,
      scopes: entity.scopes,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
    };
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    const keys = await this.service.findByUser(userId);
    // Never expose keyHash
    return keys.map(({ keyHash: _h, ...safe }) => safe);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateApiKeyDto) {
    const entity = await this.service.update(id, dto);
    const { keyHash: _h, ...safe } = entity;
    return safe;
  }

  @Patch(':id/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(@Param('id') id: string) {
    await this.service.revoke(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
  }
}
