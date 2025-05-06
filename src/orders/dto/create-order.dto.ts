import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'ID of the buyer', example: 'userId123' })
  @IsString()
  buyerId: string;

  @ApiProperty({ description: 'ID of the product/item' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Total order amount', example: 'productId456' })
  @IsNumber()
  totalAmount: number;
}
