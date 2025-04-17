import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Tag } from 'lucide-react-native';

export type JobCategory = {
  id: string;
  name: string;
  count: number;
};

type JobCategoriesProps = {
  categories: JobCategory[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
};

export default function JobCategories({
  categories,
  selectedCategories,
  onToggleCategory,
}: JobCategoriesProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Tag size={20} color="#0891b2" />
        <Text style={styles.title}>Job Categories</Text>
      </View>
      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategories.includes(category.id) && styles.categoryButtonSelected
            ]}
            onPress={() => onToggleCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategories.includes(category.id) && styles.categoryTextSelected
              ]}
            >
              {category.name}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{category.count}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
    marginLeft: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonSelected: {
    backgroundColor: '#0891b2',
    borderColor: '#0891b2',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#4b5563',
  },
  categoryTextSelected: {
    color: '#ffffff',
  },
  countBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#6b7280',
  },
});