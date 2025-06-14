import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { getProducts, getSales, getDashboardStats, getTopProducts, getLowStockProducts } from '@/lib/data';
// Use the API key directly
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
console.log('API Key available:', !!apiKey); // This will log true if the key exists, false if it doesn't

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: 'Query is required'
        },
        { status: 400 }
      );
    }

    // Fetch all relevant data
    const [products, sales, stats, topProducts, lowStock] = await Promise.all([
      getProducts(),
      getSales(),
      getDashboardStats(),
      getTopProducts(),
      getLowStockProducts()
    ]);

    // Prepare the context with current data
    const context = {
      products,
      sales,
      stats,
      topProducts,
      lowStock
    };

    try {
      console.log('Attempting to generate AI response...');
      const { object } = await generateObject({
        model: google('gemini-1.5-flash'),
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        schema: z.object({
          Topic: z.object({
            Heading: z.string(),
            Description: z.string(),
            SqlQuery: z.array(z.string()).optional(),
          }),
        }),
        prompt: `Analyze the following inventory and sales data:
                ${JSON.stringify(context)}
                
                User Query: ${query}
                
                # If user Ask About The Datas Answer The Question By Viewing The datas and Db  Structure Give The Answers
                # If User Ask To Add Update Or Delete The Data:
                # 1. First check if all necessary information is provided
                # 2. If information is missing, ask for it in the Description
                # 3. Only provide SQL query when all required information is available

                
                # Response Guidelines:
                1). Heading:
                    - Provide a clear, concise heading that reflects the query
                    - Keep it relevant and specific to the user's question
                    
                2). Description:
                    - Analyze the data and provide insights based on the specific query
                    - Use appropriate formatting for better readability:
                      * Tables for structured data comparisons and where Table Like can Show Can Use Tables
                      * Lists for multiple points or steps
                      * Blockquotes for important notes
                      * Bold text for emphasis
                      * Emojis to enhance visual appeal
                    - Focus on answering exactly what the user asked
                    - Answer to More Long and Short and Clear and try To Give In Tables List based Instead Of Long Based Paragraphs
                    - Use Of Formatting Symbols In the response SO Show Of Data Can Be Easy In React Markdown So Give Accordingly
                    - Keep the response concise and relevant
                    - Use markdown formatting for better presentation
                    
                3). SqlQuery (Optional):
                    - Only provide if all necessary information is available
                    - For data modifications (add/update/delete), include the complete SQL query
                    - For data queries, include the SELECT query to get the requested information
                    - Format SQL queries in code blocks with \`\`\`sql
                    - Add comments to explain complex queries

                Important Notes:
                - Be flexible in your response format based on the query type
                - ALWAYS use tables for:
                  * Product listings with multiple attributes
                  * Sales data with multiple metrics
                  * Any comparison between multiple items
                  * Any data that has more than 2 columns
                  * Use Tables Where It Possible and Looks Easy To Understand For User Use Tables
                  * Usage of Tables Is Important In Data Analysis And Reporting and View Datas Like That
                - Keep the response focused on the user's specific question
                - Avoid unnecessary sections or repetitive information
                - Use appropriate markdown formatting for better readability
                - Maintain a professional yet conversational tone
                - Always use ₹ symbol for INR amounts
                - Format large numbers with commas (e.g., ₹1,00,000)
                - Use K for thousands (e.g., ₹50K)
                - Include decimal places for precise amounts (e.g., ₹1,234.56)
                - Use consistent spacing after ₹ symbol
                - Format percentages without ₹ symbol
                - Use bold for total amounts


                Response Format Examples:

                1. For Product Listings:
                   ### 📊 Top Products by Revenue
                   | Product | Category | Revenue (₹) | Units Sold |
                   |:--------|:---------|:------------|:-----------|
                   | Laptop Pro | Electronics | 50,699.61 | 28 |
                   | 4K Monitor | Electronics | 14,499.71 | 24 |
                   | USB-C Dock | Accessories | 2,699.70 | 26 |
                   | **Total** | | **68,899.02** | **78** |

                   > Note: Electronics dominate the revenue with 94% of total sales

                2. For Category Analysis:
                   ### 📈 Category Performance
                   | Category | Revenue (₹) | % of Total | Top Product |
                   |:---------|:------------|:-----------|:------------|
                   | Electronics | 65,199.32 | 94% | Laptop Pro |
                   | Accessories | 4,699.75 | 6% | USB-C Dock |

                   * 💰 Electronics category leads with $65.2K revenue
                   * 📦 Accessories show strong unit sales but lower revenue
                   * 🔄 Laptop Pro drives 73% of Electronics revenue

                3. For Sales Trends:
                   ### 📊 Monthly Sales Overview
                   | Month | Revenue (₹) | Growth | Top Product |
                   |:------|:------------|:-------|:------------|
                   | June | 72,008.25 | +15% | Laptop Pro |
                   | May | 62,615.87 | +8% | 4K Monitor |
                   | April | 57,977.66 | - | USB-C Dock |

                   > Note: June shows strongest growth in Electronics category

                4. For Inventory Status:
                   ### 📦 Current Stock Levels
                   | Product | In Stock | Low Stock | Status |
                   |:--------|:---------|:----------|:--------|
                   | Laptop Pro | 5 | < 10 | ⚠️ Critical |
                   | 4K Monitor | 12 | < 15 | 🟡 Warning |
                   | USB-C Dock | 25 | < 20 | ✅ Good |

                   * ⚠️ Laptop Pro requires immediate restocking
                   * 🟡 Monitor stock approaching warning level
                   * ✅ Accessories well-stocked

                5. For Simple Queries:
                   ### 💡 Quick Answer
                   The Electronics category leads with $65.2K revenue (94% of total), driven by the Laptop Pro ($50.7K) and 4K Monitor ($14.5K). Accessories contribute $4.7K (6%) with strong unit sales but lower revenue per item.

                Markdown Formatting Rules:
                1. Headers:
                   - Use ### for main sections
                   - Keep headers concise and descriptive
                   - Add relevant emojis for visual hierarchy

                2. Tables:
                   - Use for structured data and comparisons
                   - Include relevant metrics
                   - Format numbers with proper separators
                   - Add totals when applicable
                   - Sort by relevant metric

                3. Lists:
                   - Use for key points and insights
                   - Keep items concise
                   - Add relevant emojis

                4. Blockquotes:
                   - Use for important notes
                   - Keep them brief and relevant

                5. Emphasis:
                   - Use **bold** for important metrics
                   - Use *italic* for emphasis
                   - Use \`code\` for technical terms

                6. Spacing:
                   - Add blank lines between sections
                   - Keep paragraphs short
                   - Use consistent spacing

                7. Emojis:
                   - Use for visual hierarchy
                   - Common emojis:
                     * 📊 for statistics
                     * 📈 for trends
                     * ⚠️ for warnings
                     * 💡 for insights
                     * 🔍 for analysis
                     * 📌 for key points
                     * 💰 for financial data
                     * 📦 for inventory data
                     * 🔄 for actions
                     * 📋 for lists
                     * ✅ for good status
                     * 🟡 for warning
                     * ❌ for critical

                8. Code Blocks:
                   - Use \`\`\`sql for SQL queries
                   - Use \`\`\` for other code
                   - Add comments for clarity

                9. Links:
                   - Use [text](url) format
                   - Keep link text descriptive

                10. UI Design Guidelines:
                    - Keep text left-aligned
                    - Use consistent font sizes
                    - Maintain proper spacing
                    - Ensure tables are responsive
                    - Use appropriate colors
                    - Keep layout clean
                    - Make content scannable
                    - Use whitespace effectively
                    - Ensure good contrast
                    - Keep design consistent
               `
      });

      console.log('Successfully generated AI response');
      return NextResponse.json({ 
        response: object,
        data: context
      });
    } catch (aiError: any) {
      console.error('AI Generation Error:', {
        error: aiError,
        message: aiError.message,
        stack: aiError.stack
      });

      return NextResponse.json(
        { 
          error: 'Failed to generate analysis',
          details: aiError.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Request Processing Error:', {
      error,
      message: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 