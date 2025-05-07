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
      include: {
        subcategories: {
          include: {
            children: {
              include: {
                children: {
                  include: {
                    children: {
                      include: {
                        children: true, // 🔁 depth 5 — expand more if needed
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return categories.map((category) => ({
      ...category,
      attributes: category.attributes ?? {},
    }));
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) return null;

    const subcategories = await this.prisma.subCategory.findMany({
      where: {
        categoryId: id,
        parentId: null,
      },
    });

    return {
      ...category,
      attributes: category.attributes ?? {},
      subcategories: await Promise.all(
        subcategories.map(async (sub) => ({
          ...sub,
          attributes: sub.attributes ?? {},
          subcategories: await this.buildSubcategoryTree(sub.id),
        })),
      ),
    };
  }

  private async buildSubcategoryTree(parentId: string): Promise<any[]> {
    const children = await this.prisma.subCategory.findMany({
      where: { parentId },
    });

    return Promise.all(
      children.map(async (child) => ({
        ...child,
        attributes: child.attributes ?? {},
        subcategories: await this.buildSubcategoryTree(child.id),
      })),
    );
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
