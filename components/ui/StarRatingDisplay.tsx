import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';

interface StarRatingDisplayProps {
  rating: number;
  maxStars?: number;
  starSize?: number;
  showRatingNumber?: boolean;
  ratingNumberStyle?: object;
  starColorFilled?: string;
  starColorEmpty?: string;
  starContainerStyle?: object;
}

const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  rating,
  maxStars = 5,
  starSize = 16,
  showRatingNumber = true,
  ratingNumberStyle,
  starColorFilled = '#FFC700', // Gold color from customer profile
  starColorEmpty = '#4A5588',  // Empty star color from customer profile
  starContainerStyle,
}) => {
  const filledStars = Math.round(rating * 2) / 2; // Rounds to nearest 0.5
  const numFilled = Math.floor(filledStars);
  // const hasHalfStar = filledStars % 1 !== 0; // Not implementing half stars for now with lucide

  return (
    <View style={[styles.overallContainer, starContainerStyle]}>
      <View style={styles.starsRowContainer}>
        {Array.from({ length: maxStars }).map((_, index) => (
          <Star
            key={index}
            size={starSize}
            color={index < numFilled ? starColorFilled : starColorEmpty}
            fill={index < numFilled ? starColorFilled : 'none'}
            style={styles.star}
          />
        ))}
      </View>
      {showRatingNumber && (
        <Text style={[styles.ratingNumber, ratingNumberStyle]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overallContainer: {
    alignItems: 'center',
  },
  starsRowContainer: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  star: {
    marginRight: 2,
  },
  ratingNumber: {
    fontSize: 14,
    color: '#FFC700',
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
});

export default StarRatingDisplay; 