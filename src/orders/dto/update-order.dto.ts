import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateOrderDto {
  @ApiProperty({
    description: 'Order status (pending, paid, shipped, completed)',
  })
  @IsString()
  status: string;
}
