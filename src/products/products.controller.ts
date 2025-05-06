import {
  Controller,
  Get,
  Req,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';
import { AuthenticatedRequest } from 'src/types/express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from 'src/config/cloudinary.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('MERCHANT', 'ADMIN')
  @UseInterceptors(FilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create Product with Image',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'iPhone 15' },
        price: { type: 'number', example: 1200 },
        quantity: { type: 'number' },
        listingType: {
          type: 'string',
          enum: ['ECOMMERCE', 'BROKERAGE', 'SERVICE'],
          example: 'ECOMMERCE',
        },
        subCategoryId: { type: 'string' },
        description: { type: 'string', example: 'A premium Apple smartphone' },
        attributes: {
          type: 'object',
          example: { color: 'black', storage: '128GB' },
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createProductDto: CreateProductDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const imageUrls = files
      ? await this.cloudinaryService.uploadImage(files)
      : undefined;

    return this.productsService.create(
      { ...createProductDto, imageUrls } as CreateProductDto,
      req.user.userId,
    );
  }
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
  @Get('by-category/:categoryId')
  @ApiOperation({ summary: 'Get products by category ID' })
  @ApiParam({
    name: 'categoryId',
    description: 'The ID of the category to fetch products for',
    required: true,
    example: '6634abcf276b278fe8917bb7',
  })
  @ApiOkResponse({
    description: 'List of products in the category',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '6634acff4f50c2b9c91313af' },
          name: { type: 'string', example: 'Laptop' },
          price: { type: 'number', example: 1200 },
          quantity: { type: 'number', example: 5 },
          description: { type: 'string', example: 'High-performance laptop' },
          imageUrls: {
            type: 'array',
            items: {
              type: 'string',
              example: 'https://example.com/image1.jpg',
            },
          },
          listingType: {
            type: 'string',
            enum: ['ECOMMERCE', 'BROKERAGE', 'SERVICE'],
          },
          brokerageType: {
            type: 'string',
            nullable: true,
            enum: ['SALE', 'RENT'],
          },
          attributes: { type: 'object', example: { color: 'red', size: 'L' } },
          subcategoryId: { type: 'string' },
          userId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          subcategory: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              category: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  attributes: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
  })
  async getProductsByCategory(@Param('categoryId') categoryId: string) {
    return this.productsService.findByCategoryId(categoryId);
  }
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MERCHANT')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update Product with Image',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        price: { type: 'number' },
        quantity: { type: 'string' },
        listingType: {
          type: 'string',
          enum: ['ECOMMERCE', 'BROKERAGE', 'SERVICE'],
        },
        subCategoryId: { type: 'string' },
        description: { type: 'string' },
        attributes: { type: 'object' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const imageUrls = files
      ? await this.cloudinaryService.uploadImage(files)
      : undefined;

    return this.productsService.update(id, {
      ...updateProductDto,
      imageUrls,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
