import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/auth/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          ...data,
          attributes: data.attributes ?? {},
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes('Category_name_key')
      ) {
        throw new BadRequestException(
          `Category with name "${data.name}" already exists.`,
        );
      }
      throw error;
    }
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: { subcategories: true },
    });

    return categories.map((category) => ({
      ...category,
      attributes: category.attributes ?? {},
    }));
  }

  async findOne(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: { subcategories: true },
    });
  }

  async update(id: string, data: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
