/**
 * Manual Test Script for Plate Calorie Estimator - Image-Based Tests
 *
 * This script provides manual testing for image-based functionality of plateCalorieEstimator.ts
 * using vision models and OpenRouter client.
 */

import { OpenRouterClient } from './src/openrouter';
import { estimatePlateCalories, renderCalorieEstimate, CalorieEstimate } from './src/plateCalorieEstimator';

/**
 * Local implementation of tryParseEstimate for testing purposes
 * (not exported from the original module)
 */
const tryParseEstimate = (text: string): CalorieEstimate | undefined => {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/\{[\s\S]*\}/);
  const candidate = fenceMatch ? fenceMatch[0] : trimmed;

  const coerceNumber = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.\-]/g, '');
      const n = parseFloat(cleaned);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  };

  try {
    const raw = JSON.parse(candidate) as Partial<CalorieEstimate>;
    const est: CalorieEstimate = {
      kcal_low: coerceNumber(raw.kcal_low),
      kcal_high: coerceNumber(raw.kcal_high),
      protein_g: coerceNumber(raw.protein_g),
      carbs_g: coerceNumber(raw.carbs_g),
      fat_g: coerceNumber(raw.fat_g),
      notes: typeof raw.notes === 'string' ? raw.notes.trim() : ''
    };
    if (est.kcal_low === 0 && est.kcal_high === 0 && est.protein_g === 0 && est.carbs_g === 0 && est.fat_g === 0) {
      return undefined;
    }
    return est;
  } catch {
    return undefined;
  }
};

// Test Configuration - USER INPUT REQUIRED
const TEST_API_KEY = process.env.OPENROUTER_API_KEY || 'your-api-key-here';
const TEST_IMAGE_PATH = './test-images/meal.jpg'; // Replace with actual test image path
const TEST_BASE64_IMAGE = 'data:image/jpeg;base64,...'; // Replace with actual base64 image data

// Initialize OpenRouter Client
const openRouterClient = new OpenRouterClient({
  apiKey: TEST_API_KEY,
  visionModel: 'mistralai/mistral-nemo',
  textModel: 'allenai/olmo-3-32b-think'
});

/**
 * Test 1: Estimate Plate Calories with Image Path
 */
async function testEstimateWithImagePath() {
  console.log('=== Test 1: Estimate with Image Path ===');

  if (!openRouterClient.isEnabled()) {
    console.log('OpenRouter client not enabled - skipping API tests');
    return;
  }

  try {
    const result = await estimatePlateCalories({
      imagePath: TEST_IMAGE_PATH,
      captionText: 'A balanced meal with grilled chicken, brown rice, and steamed vegetables',
      openRouterClient
    });

    console.log('Estimation result:', result);
    if (result) {
      console.log('Rendered result:', renderCalorieEstimate(result));
    }
  } catch (error) {
    console.error('Error in image path test:', error);
  }
}

/**
 * Test 2: Estimate Plate Calories with Base64 Data
 */
async function testEstimateWithBase64() {
  console.log('=== Test 2: Estimate with Base64 Data ===');

  if (!openRouterClient.isEnabled()) {
    console.log('OpenRouter client not enabled - skipping API tests');
    return;
  }

  try {
    const result = await estimatePlateCalories({
      base64Data: TEST_BASE64_IMAGE,
      mimeType: 'image/jpeg',
      captionText: 'A healthy plate with salmon, quinoa, and mixed greens',
      openRouterClient
    });

    console.log('Estimation result:', result);
    if (result) {
      console.log('Rendered result:', renderCalorieEstimate(result));
    }
  } catch (error) {
    console.error('Error in base64 test:', error);
  }
}

/**
 * Test 3: Edge Cases with Images
 */
async function testImageEdgeCases() {
  console.log('=== Test 3: Image Edge Cases ===');

  if (!openRouterClient.isEnabled()) {
    console.log('OpenRouter client not enabled - skipping API tests');
    return;
  }

  // Test with no image data
  try {
    const result = await estimatePlateCalories({
      captionText: 'Just a caption, no image',
      openRouterClient
    });
    console.log('No image result:', result);
  } catch (error) {
    console.log('Expected error for no image:', error.message);
  }

  // Test with special characters in caption
  try {
    const result = await estimatePlateCalories({
      imagePath: TEST_IMAGE_PATH,
      captionText: 'Meal with 🍗 chicken, 🥦 broccoli, and 🍚 rice',
      openRouterClient
    });
    console.log('Special characters result:', result);
    if (result) {
      console.log('Rendered:', renderCalorieEstimate(result));
    }
  } catch (error) {
    console.log('Special characters error:', error.message);
  }
}

/**
 * Test 4: Performance and Validation with Images
 */
async function testImagePerformance() {
  console.log('=== Test 4: Image Performance and Validation ===');

  if (!openRouterClient.isEnabled()) {
    console.log('OpenRouter client not enabled - skipping performance tests');
    return;
  }

  const startTime = Date.now();

  try {
    // Run multiple estimations to test performance
    const promises: Promise<CalorieEstimate | undefined>[] = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        estimatePlateCalories({
          imagePath: TEST_IMAGE_PATH,
          captionText: `Test meal ${i + 1}`,
          openRouterClient
        })
      );
    }

    const results = await Promise.all(promises);
    const endTime = Date.now();

    console.log('Multiple estimations completed in', (endTime - startTime) / 1000, 'seconds');
    console.log('Results count:', results.filter(r => r !== undefined).length);

    // Validate that all results have required fields
    results.forEach((result, index) => {
      if (result) {
        const hasRequiredFields = result.kcal_low > 0 &&
                                result.kcal_high > 0 &&
                                result.protein_g >= 0 &&
                                result.carbs_g >= 0 &&
                                result.fat_g >= 0;

        console.log(`Result ${index + 1} validation:`, hasRequiredFields ? 'PASS' : 'FAIL');
      }
    });
  } catch (error) {
    console.error('Performance test error:', error);
  }
}

/**
 * Run All Image-Based Tests
 */
async function runAllImageTests() {
  console.log('Starting Plate Calorie Estimator Image-Based Manual Tests\n');

  // Run all image-based test functions
  await testEstimateWithImagePath();
  await testEstimateWithBase64();
  await testImageEdgeCases();
  await testImagePerformance();

  console.log('\nAll image-based manual tests completed!');
}

// Execute tests
runAllImageTests().catch(console.error);