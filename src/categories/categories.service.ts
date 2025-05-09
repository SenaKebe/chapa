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
    const categories = await this.prisma.category.findMany();

    return Promise.all(
      categories.map(async (category) => {
        const allSubcategories = await this.prisma.subCategory.findMany({
          where: { categoryId: category.id },
        });

        const subcategoryTree =
          this.buildSubcategoryTreeFromList(allSubcategories);

        return {
          ...category,
          attributes: category.attributes ?? {},
          subcategories: subcategoryTree, // ✅ Only top-level subcategories, children nested
        };
      }),
    );
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) return null;

    const allSubcategories = await this.prisma.subCategory.findMany({
      where: { categoryId: id },
    });

    const subcategoryTree = this.buildSubcategoryTreeFromList(allSubcategories);

    return {
      ...category,
      attributes: category.attributes ?? {},
      subcategories: subcategoryTree,
    };
  }

  // ✅ This utility builds the nested hierarchy cleanly
  private buildSubcategoryTreeFromList(subcategories: any[]) {
    const map = new Map<string, any>();

    subcategories.forEach((sub) => {
      map.set(sub.id, { ...sub, children: [] });
    });

    const roots: any[] = [];

    subcategories.forEach((sub) => {
      const node = map.get(sub.id);
      if (!node) return;

      if (sub.parentId) {
        const parent = map.get(sub.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
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
