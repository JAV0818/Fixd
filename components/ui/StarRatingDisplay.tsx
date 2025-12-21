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
  starColorFilled = '#FFC700',
  starColorEmpty = '#4A5588',
  starContainerStyle,
}) => {
  const filledStars = Math.round(rating * 2) / 2; // Rounds to nearest 0.5
  const numFilled = Math.floor(filledStars);
  const hasHalfStar = filledStars % 1 !== 0;

  return (
    <View style={[styles.overallContainer, starContainerStyle]}>
      <View style={styles.starsRowContainer}>
        {Array.from({ length: maxStars }).map((_, index) => {
          const isFilled = index < numFilled;
          const isHalf = hasHalfStar && index === numFilled;
          
          return (
            <View key={index} style={styles.starWrapper}>
              <Star
                size={starSize}
                color={isFilled || isHalf ? starColorFilled : starColorEmpty}
                fill={isFilled ? starColorFilled : 'none'}
                style={styles.star}
              />
              {isHalf && (
                <View style={[styles.halfStarMask, { width: starSize / 2, height: starSize }]}>
                  <Star
                    size={starSize}
                    color={starColorFilled}
                    fill={starColorFilled}
                    style={styles.star}
                  />
                </View>
              )}
            </View>
          );
        })}
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
  starWrapper: {
    position: 'relative',
    marginRight: 2,
  },
  star: {
    marginRight: 0,
  },
  halfStarMask: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  ratingNumber: {
    fontSize: 14,
    color: '#FFC700',
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
});

export default StarRatingDisplay; 