// import { ListingType } from '@prisma/client';
// import {
//   IsString,
//   IsNotEmpty,
//   IsNumber,
//   Min,
//   IsEnum,
//   IsObject,
//   IsOptional,
// } from 'class-validator';
// import { Transform } from 'class-transformer';

// export class CreateProductDto {
//   @IsString()
//   @IsNotEmpty()
//   name: string;

//   @IsString()
//   @IsNotEmpty()
//   subCategoryId: string;

//   @IsNumber()
//   @Min(0)
//   price: number;

//   @IsNumber()
//   @Min(0)
//   quantity: number;

//   @Transform(({ value }) => value.toUpperCase())
//   @IsEnum(ListingType, { message: 'Invalid listing type' })
//   listingType: ListingType;

//   @IsObject()
//   attributes: Record<string, any>;

//   @IsOptional()
//   @IsString()
//   description?: string;

//   @IsOptional()
//   @IsString({ each: true })
//   imageUrls?: string[];
// }

import { ListingType } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
  IsArray,
  Validate,
  IsDefined,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  subCategoryId: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  quantity: number;

  @Transform(({ value }) => value.toUpperCase())
  @IsEnum(ListingType, { message: 'Invalid listing type' })
  listingType: ListingType;

  // This is the key part:
  @IsArray()
  @IsDefined({ each: true })
  attributes: Record<string, string>[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString({ each: true })
  imageUrls?: string[];
}
