import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import {
  ChangeOrderStatusDto,
  CreateOrderDto,
  PaginationOrderDto,
} from './dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected...');
  }

  async create(createOrderDto: CreateOrderDto) {
    const { items } = createOrderDto;
    const productIds = items.map((item) => item.productId);
    const products: any[] = await firstValueFrom(
      this.client.send('validateProducts', productIds),
    );

    const totalAmount = items.reduce((acc, orderItem) => {
      const price = products.find(
        (product) => product.id === orderItem.productId,
      ).price;
      return price * orderItem.quantity;
    }, 0);

    const totalItems = items.reduce((acc, orderItem) => {
      return acc + orderItem.quantity;
    }, 0);

    const order = await this.order.create({
      data: {
        totalAmount: totalAmount,
        totalItems: totalItems,
        OrderItem: {
          createMany: {
            data: items.map((orderItem) => ({
              price: products.find(
                (product) => product.id === orderItem.productId,
              ).price,
              productId: orderItem.productId,
              quantity: orderItem.quantity,
            })),
          },
        },
      },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });

    const response = {
      ...order,
      orderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((product) => product.id === orderItem.productId)
          .name,
      })),
    };

    delete response.OrderItem;

    return response;
  }

  async findAll(paginationDto: PaginationOrderDto) {
    const { page, limit, status } = paginationDto;
    const totalPages = await this.order.count({ where: { status: status } });
    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { status: status },
      }),
      meta: {
        total: totalPages,
        page: page,
        lastPage: lastPage,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            productId: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    const productIds = order.OrderItem.map((item) => item.productId);
    const products: any[] = await firstValueFrom(
      this.client.send('validateProducts', productIds),
    );

    const response = {
      ...order,
      orderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((product) => product.id === orderItem.productId)
          .name,
      })),
    };

    delete response.OrderItem;

    return response;
  }

  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;

    const order = await this.findOne(id);

    if (order.status === status) {
      return order;
    }

    return this.order.update({
      where: { id },
      data: { status: status },
    });
  }
}
