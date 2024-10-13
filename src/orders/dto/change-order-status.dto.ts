import { OrderStatus } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';
import { Transform } from 'class-transformer';

export class ChangeOrderStatusDto {
  @IsUUID(4)
  id: string;

  @Transform(({ value }) => value.toUpperCase())
  @IsEnum(OrderStatusList, { message: `Valid status are ${OrderStatusList}` })
  status: OrderStatus;
}
