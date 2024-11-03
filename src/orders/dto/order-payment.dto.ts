import { IsString, IsUrl, IsUUID } from 'class-validator';

export class OrderPayment {
  @IsString()
  paidId: string;

  @IsString()
  @IsUUID()
  orderId: string;

  @IsString()
  @IsUrl()
  receiptUrl: string;
}
