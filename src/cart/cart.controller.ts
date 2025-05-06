import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiParam } from '@nestjs/swagger';
import { Req } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/auth/interfaces/authenticated-request.interface';
import { CartItemWithProductDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @ApiBody({
    description: 'Add item to cart',
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string', example: 'prod456' },
        quantity: { type: 'number', example: 2 },
      },
    },
  })
  addToCart(
    @Body() addToCartDto: AddToCartDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.cartService.addToCart({
      ...addToCartDto,
      buyerId: req.user.userId,
    });
  }
  @Get()
  @ApiOperation({ summary: 'Get user cart with product details' })
  @ApiResponse({
    status: 200,
    description: 'Returns cart items with product info',
    type: [CartItemWithProductDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCart(@Req() req: AuthenticatedRequest) {
    return this.cartService.getCart(req.user.userId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: "Remove item from authenticated user's cart" })
  @ApiParam({ name: 'productId', type: String, example: 'prod123' })
  @ApiResponse({
    status: 200,
    description: 'Item removed successfully',
    schema: {
      example: {
        id: 'cart_item_123',
        productId: 'prod123',
        quantity: 1,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Item not found in cart' })
  async removeFromCart(@Param('productId') productId: string, @Req() req: any) {
    return this.cartService.removeFromCart(req.user.userId, productId);
  }

  @Delete('clear')
  clearCart(@Req() req: AuthenticatedRequest) {
    return this.cartService.clearCart(req.user.userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update item quantity in cart' })
  async updateCartItem(
    @Body() updateDto: UpdateCartDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.cartService.updateCartItem({
      ...updateDto,
      buyerId: req.user.userId,
    });
  }

  @Post('checkout/:buyerId')
  @HttpCode(201)
  checkout(@Param('buyerId') buyerId: string) {
    return this.cartService.checkout(buyerId);
  }
}
