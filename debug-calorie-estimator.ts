/**
 * Debug Script 2: Test Plate Calorie Estimator Module
 * 
 * This script tests the plateCalorieEstimator.ts module end-to-end
 * using the test image from the downloads folder.
 * 
 * Run: npx tsx debug-calorie-estimator.ts
 */

import 'dotenv/config';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import mime from 'mime-types';
import { OpenRouterClient } from './src/openrouter';
import {
  estimatePlateCalories,
  buildCaloriePrompt,
  renderCalorieEstimate,
  CalorieEstimate
} from './src/plateCalorieEstimator';

const TEST_IMAGE_PATH = path.resolve(process.cwd(), 'downloads', 'photo_6136538011856997208_y.jpg');

interface DebugResult {
  step: string;
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

const results: DebugResult[] = [];

function logResult(result: DebugResult): void {
  results.push(result);
  const icon = result.success ? '✅' : '❌';
  console.log(`\n${icon} ${result.step}`);
  console.log(`   ${result.message}`);
  if (result.data) {
    console.log('   Data:', typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2));
  }
  if (result.error) {
    console.log('   Error:', result.error);
  }
}

async function step1_testBuildCaloriePrompt(): Promise<boolean> {
  console.log('\n🔄 Testing buildCaloriePrompt function...');
  
  try {
    // Test with different captions
    const testCases = [
      'A plate with grilled chicken, rice, and vegetables',
      'rice and dal',
      '',
      'Pizza with extra cheese and pepperoni'
    ];

    const prompts = testCases.map(caption => ({
      caption,
      prompt: buildCaloriePrompt(caption)
    }));

    logResult({
      step: 'Step 1: Test buildCaloriePrompt',
      success: true,
      message: `Generated ${prompts.length} prompts successfully`,
      data: prompts[0] // Show first example
    });
    return true;
  } catch (error) {
    logResult({
      step: 'Step 1: Test buildCaloriePrompt',
      success: false,
      message: 'Failed to build calorie prompt',
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

async function step2_testRenderCalorieEstimate(): Promise<boolean> {
  console.log('\n🔄 Testing renderCalorieEstimate function...');
  
  try {
    const testEstimate: CalorieEstimate = {
      kcal_low: 350,
      kcal_high: 480,
      protein_g: 28,
      carbs_g: 45,
      fat_g: 18,
      notes: 'Balanced meal with lean protein and vegetables'
    };

    const rendered = renderCalorieEstimate(testEstimate);

    logResult({
      step: 'Step 2: Test renderCalorieEstimate',
      success: true,
      message: 'Rendered calorie estimate successfully',
      data: rendered
    });
    return true;
  } catch (error) {
    logResult({
      step: 'Step 2: Test renderCalorieEstimate',
      success: false,
      message: 'Failed to render calorie estimate',
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

async function step3_testEstimatePlateCaloriesWithImagePath(client: OpenRouterClient): Promise<boolean> {
  console.log('\n🔄 Testing estimatePlateCalories with imagePath...');
  
  try {
    const estimate = await estimatePlateCalories({
      imagePath: TEST_IMAGE_PATH,
      captionText: 'Food on a plate',
      openRouterClient: client
    });

    if (estimate) {
      const rendered = renderCalorieEstimate(estimate);
      logResult({
        step: 'Step 3: estimatePlateCalories with imagePath',
        success: true,
        message: 'Successfully estimated calories using imagePath',
        data: { estimate, rendered }
      });
      return true;
    } else {
      logResult({
        step: 'Step 3: estimatePlateCalories with imagePath',
        success: false,
        message: 'estimatePlateCalories returned undefined (could not parse response)',
        error: 'The API response could not be parsed into a valid CalorieEstimate'
      });
      return false;
    }
  } catch (error) {
    logResult({
      step: 'Step 3: estimatePlateCalories with imagePath',
      success: false,
      message: 'Failed to estimate calories with imagePath',
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

async function step4_testEstimatePlateCaloriesWithBase64(client: OpenRouterClient): Promise<boolean> {
  console.log('\n🔄 Testing estimatePlateCalories with base64Data...');
  
  try {
    const buffer = await readFile(TEST_IMAGE_PATH);
    const base64Data = buffer.toString('base64');
    const mimeType = mime.lookup(TEST_IMAGE_PATH);

    const estimate = await estimatePlateCalories({
      base64Data,
      mimeType: typeof mimeType === 'string' ? mimeType : 'image/jpeg',
      captionText: 'Food on a plate',
      openRouterClient: client
    });

    if (estimate) {
      const rendered = renderCalorieEstimate(estimate);
      logResult({
        step: 'Step 4: estimatePlateCalories with base64Data',
        success: true,
        message: 'Successfully estimated calories using base64Data',
        data: { estimate, rendered }
      });
      return true;
    } else {
      logResult({
        step: 'Step 4: estimatePlateCalories with base64Data',
        success: false,
        message: 'estimatePlateCalories returned undefined (could not parse response)',
        error: 'The API response could not be parsed into a valid CalorieEstimate'
      });
      return false;
    }
  } catch (error) {
    logResult({
      step: 'Step 4: estimatePlateCalories with base64Data',
      success: false,
      message: 'Failed to estimate calories with base64Data',
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

async function step5_testEstimatePlateCaloriesWithBothParams(client: OpenRouterClient): Promise<boolean> {
  console.log('\n🔄 Testing estimatePlateCalories with both imagePath AND base64Data...');
  console.log('   (This simulates WhatsApp flow where we have both)');
  
  try {
    const buffer = await readFile(TEST_IMAGE_PATH);
    const base64Data = buffer.toString('base64');
    const mimeType = mime.lookup(TEST_IMAGE_PATH);

    const estimate = await estimatePlateCalories({
      imagePath: TEST_IMAGE_PATH,
      base64Data,
      mimeType: typeof mimeType === 'string' ? mimeType : 'image/jpeg',
      captionText: 'Estimate the calories for this meal',
      openRouterClient: client
    });

    if (estimate) {
      const rendered = renderCalorieEstimate(estimate);
      logResult({
        step: 'Step 5: estimatePlateCalories with both params',
        success: true,
        message: 'Successfully estimated calories using both imagePath and base64Data',
        data: { estimate, rendered }
      });
      return true;
    } else {
      logResult({
        step: 'Step 5: estimatePlateCalories with both params',
        success: false,
        message: 'estimatePlateCalories returned undefined (could not parse response)',
        error: 'The API response could not be parsed into a valid CalorieEstimate'
      });
      return false;
    }
  } catch (error) {
    logResult({
      step: 'Step 5: estimatePlateCalories with both params',
      success: false,
      message: 'Failed to estimate calories with both params',
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

async function step6_testWithDetailedCaption(client: OpenRouterClient): Promise<boolean> {
  console.log('\n🔄 Testing estimatePlateCalories with detailed caption...');
  
  try {
    const estimate = await estimatePlateCalories({
      imagePath: TEST_IMAGE_PATH,
      captionText: 'This looks like a typical Indian meal with rice, dal, vegetables, and maybe some protein',
      openRouterClient: client
    });

    if (estimate) {
      const rendered = renderCalorieEstimate(estimate);
      logResult({
        step: 'Step 6: estimatePlateCalories with detailed caption',
        success: true,
        message: 'Successfully estimated calories with detailed caption',
        data: { estimate, rendered }
      });
      return true;
    } else {
      logResult({
        step: 'Step 6: estimatePlateCalories with detailed caption',
        success: false,
        message: 'estimatePlateCalories returned undefined',
        error: 'The API response could not be parsed into a valid CalorieEstimate'
      });
      return false;
    }
  } catch (error) {
    logResult({
      step: 'Step 6: estimatePlateCalories with detailed caption',
      success: false,
      message: 'Failed to estimate calories with detailed caption',
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

async function runAllTests(): Promise<void> {
  console.log('🔧 Debug Script 2: Plate Calorie Estimator Test');
  console.log('='.repeat(60));

  // Check prerequisites
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log('\n❌ OPENROUTER_API_KEY is not set in .env file');
    console.log('   Please create a .env file with: OPENROUTER_API_KEY=your_key');
    process.exit(1);
  }

  try {
    await access(TEST_IMAGE_PATH, constants.R_OK);
  } catch {
    console.log(`\n❌ Test image not found at: ${TEST_IMAGE_PATH}`);
    console.log('   Please ensure there is a .jpg image in the downloads folder');
    process.exit(1);
  }

  // Create OpenRouter client
  const client = new OpenRouterClient({
    apiKey: process.env.OPENROUTER_API_KEY,
    textModel: process.env.OPENROUTER_TEXT_MODEL,
    visionModel: process.env.OPENROUTER_VISION_MODEL,
    referer: process.env.OPENROUTER_REFERER,
    appTitle: process.env.OPENROUTER_APP_TITLE ?? 'WhatsApp Demo Bot - Debug'
  });

  console.log('\n📋 Configuration:');
  console.log(`   Image: ${TEST_IMAGE_PATH}`);
  console.log(`   Vision Model: ${process.env.OPENROUTER_VISION_MODEL ?? 'default'}`);
  console.log(`   Text Model: ${process.env.OPENROUTER_TEXT_MODEL ?? 'default'}`);

  // Run tests
  await step1_testBuildCaloriePrompt();
  await step2_testRenderCalorieEstimate();
  await step3_testEstimatePlateCaloriesWithImagePath(client);
  await step4_testEstimatePlateCaloriesWithBase64(client);
  await step5_testEstimatePlateCaloriesWithBothParams(client);
  await step6_testWithDetailedCaption(client);

  printSummary();
}

function printSummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.step}`);
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n💡 TROUBLESHOOTING TIPS:');
    console.log('   1. First run: npx tsx debug-vision-api.ts (to verify API works)');
    console.log('   2. Check if vision model returns valid JSON');
    console.log('   3. Try a different vision model (e.g., gpt-4o, claude-3-sonnet-20240229)');
    console.log('   4. The model might not understand the image - try a clearer food photo');
  }

  if (passed === results.length) {
    console.log('\n✅ All tests passed! The calorie estimator is working correctly.');
    console.log('   You can now use it through the WhatsApp bot with:');
    console.log('   !calories <description of food>');
  }
}

runAllTests().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
