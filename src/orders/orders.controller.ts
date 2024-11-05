import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import {
  ChangeOrderStatusDto,
  CreateOrderDto,
  OrderPayment,
  PaginationOrderDto,
} from './dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('order.create')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.create(createOrderDto);
    const createSession = await this.ordersService.createSession(order);
    return createSession;
  }

  @MessagePattern('order.find.all')
  findAll(@Payload() paginationDto: PaginationOrderDto) {
    return this.ordersService.findAll(paginationDto);
  }

  @MessagePattern('order.find.one')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('order.change.status')
  changeOrderStatus(@Payload() changeOrderStatusDto: ChangeOrderStatusDto) {
    return this.ordersService.changeOrderStatus(changeOrderStatusDto);
  }

  @EventPattern('order.payment')
  OrderPayment(@Payload() orderPayment: OrderPayment) {
    return this.ordersService.orderPayment(orderPayment);
  }
}
