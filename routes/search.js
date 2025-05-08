const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

/**
 * Enhanced search route - searches across ALL product tables in the database
 * @route GET /api/search
 * @param {string} q - Search query
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Results per page (default: 12)
 * @returns {object} Search results with pagination info
 */
router.get('/', (req, res) => {
    try {
        console.log('Search request received:', req.query);
        
        const searchTerm = req.query.q;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;
        const grade = req.query.grade;
        const publisher = req.query.publisher;
        const categories = Array.isArray(req.query.category) ? req.query.category : [req.query.category].filter(Boolean);
        const elements = Array.isArray(req.query.element) ? req.query.element : [req.query.element].filter(Boolean);
        
        // If no search term and no filters, return empty result
        if ((!searchTerm || searchTerm.trim().length < 2) && 
            (!grade || grade === 'all') && 
            (!publisher || publisher === 'all') &&
            categories.length === 0 &&
            elements.length === 0) {
            console.log('No search term or filters provided');
            return res.status(400).json({ 
                success: false,
                message: 'Please provide a search term or select filters'
            });
        }

        // Function to expand search terms into variations for better matching
        const expandSearchTerms = (term) => {
            // Clean the term by removing extra spaces and special characters
            const cleanTerm = term.trim().replace(/\s+/g, ' ');
            
            // Generate search patterns
            const patterns = [
                `%${cleanTerm}%`,                  // Exact phrase anywhere
                `%${cleanTerm.split(' ').join('%')}%`  // Words in order but possibly separated
            ];
            
            // For multi-word searches, add individual words
            if (cleanTerm.includes(' ')) {
                const words = cleanTerm.split(' ');
                words.forEach(word => {
                    if (word.length >= 3) {  // Only include words of reasonable length
                        patterns.push(`%${word}%`);
                    }
                });
            }
            
            return patterns;
        };
        
        // Generate search patterns from the search term
        const searchPatterns = expandSearchTerms(searchTerm);
        console.log('Search patterns:', searchPatterns);
        
        // We'll use the first pattern as primary
        const searchPattern = searchPatterns[0];  
        
        // First get a list of all tables in the database
        db.query('SHOW TABLES', (err, tables) => {
            if (err) {
                console.error('Error getting database tables:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error checking database tables',
                    error: err.message
                });
            }
            
            console.log('Available tables:', tables);
            
            // Get all tables except system tables and those we know aren't product tables
            const excludedTables = ['users', 'admins', 'sessions', 'logs', 'migrations', 'orders', 'order_items', 'settings', 'permissions', 'carts'];
            
            // Extract table names from the results
            const allTables = tables.map(table => {
                const firstKey = Object.keys(table)[0];
                return table[firstKey];
            }).filter(tableName => {
                return !excludedTables.includes(tableName.toLowerCase()) &&
                       !tableName.includes('schema_') &&
                       !tableName.startsWith('_');
            });
            
            console.log('Tables to search:', allTables);
            
            // If no tables exist, return empty result
            if (allTables.length === 0) {
                console.log('No tables found in database');
                return res.json({
                    success: true,
                    items: [],
                    page: page,
                    limit: limit,
                    total: 0,
                    totalPages: 0
                });
            }
            
            // Get the table structures to determine searchable columns
            const tableStructurePromises = allTables.map(tableName => {
                return new Promise((resolve, reject) => {
                    db.query(`DESCRIBE ${tableName}`, (err, columns) => {
                        if (err) {
                            console.error(`Error getting structure for table ${tableName}:`, err);
                            reject(err);
                            return;
                        }
                        
                        // Look for searchable columns (title, name, book_name, product_name, etc.)
                        const searchableColumns = columns
                            .filter(col => {
                                const colName = col.Field.toLowerCase();
                                // Expanded list of searchable column names to catch all possible variations
                                return colName.includes('name') || 
                                       colName.includes('title') || 
                                       colName === 'description' ||
                                       colName === 'book_title' ||
                                       colName === 'product_title' ||
                                       colName === 'book_name' ||
                                       colName === 'product_name' ||
                                       colName === 'apparatus_name' ||
                                       colName === 'item_name' ||
                                       colName === 'stationery_name' ||
                                       colName === 'text' ||
                                       colName === 'keywords' ||
                                       colName === 'details' ||
                                       colName === 'sku' ||
                                       colName === 'code' ||
                                       colName === 'model' ||
                                       colName === 'brand' ||
                                       colName === 'publisher' ||
                                       colName === 'author';
                            })
                            .map(col => col.Field);
                            
                        // Text columns that can be searched
                        console.log(`Table ${tableName} searchable columns:`, searchableColumns);
                        
                        resolve({
                            tableName,
                            searchableColumns,
                            columns  // Store all columns for later use
                        });
                    });
                });
            });
            
            // Wait for all table structure queries to complete
            Promise.all(tableStructurePromises)
                .then(tableStructures => {
                    // Filter out tables with no searchable columns
                    const searchableTables = tableStructures.filter(table => table.searchableColumns.length > 0);
                    
                    if (searchableTables.length === 0) {
                        console.log('No tables with searchable columns found');
                        return res.json({
                            success: true,
                            items: [],
                            page: page,
                            limit: limit,
                            total: 0,
                            totalPages: 0
                        });
                    }
                    
                    // Function to safely construct SQL for any table structure
                    const constructSafeSQL = (table, columns, isCountQuery = false) => {
                        try {
                            const { tableName, searchableColumns } = table;
                            
                            // Skip tables with no searchable columns
                            if (!searchableColumns || searchableColumns.length === 0) {
                                return { valid: false };
                            }
                            
                            // Find the title/name column to use in the result
                            const nameColumn = searchableColumns.find(col => 
                                col === 'title' || 
                                col === 'name' || 
                                col.includes('name') || 
                                col.includes('title')
                            ) || searchableColumns[0];
                            
                            // Check if columns exist in this table
                            const columnsInTable = columns.map(col => col.Field);
                            const hasId = columnsInTable.includes('id');
                            const hasPrice = columnsInTable.includes('price');
                            const hasImageUrl = columnsInTable.includes('image_url');
                            
                            // Find alternative ID column if 'id' doesn't exist
                            const idColumn = hasId ? 'id' : columns.find(col => 
                                col.Key === 'PRI' || 
                                col.Field.includes('_id') || 
                                col.Field.endsWith('id')
                            )?.Field || columnsInTable[0]; // Fall back to first column
                            
                            if (!idColumn) {
                                return { valid: false };
                            }
                            
                            // Build the SELECT clause with appropriate escaping for column names
                            let selectClause = isCountQuery 
                                ? 'SELECT COUNT(*) as count' 
                                : `SELECT \`${idColumn}\` AS id, \`${nameColumn}\` AS title`;
                            
                            // Add other columns only for regular queries, not count queries
                            if (!isCountQuery) {
                                // Add description if it exists in the table
                                if (columnsInTable.includes('description')) {
                                    selectClause += ', `description`';
                                } else {
                                    selectClause += ", '' AS description";
                                }
                                
                                // Add price and image_url if they exist, otherwise provide defaults
                                if (hasPrice) {
                                    selectClause += ', `price`';
                                } else {
                                    selectClause += ", 0 AS price";
                                }
                                
                                if (hasImageUrl) {
                                    selectClause += ', `image_url`';
                                } else {
                                    selectClause += ", '' AS image_url";
                                }
                                
                                selectClause += `, '${tableName}' as type`;
                            }
                            
                            // Build the WHERE clause with priority-based matching
                            let orConditions = [];
                            let whereParams = [];
                            
                            // Add grade filter if specified
                            if (grade && grade !== 'all') {
                                const gradeNumber = grade.replace('grade-', '');
                                orConditions.push(`grade = ?`);
                                whereParams.push(gradeNumber);
                            }
                            
                            // Add publisher filter if specified
                            if (publisher && publisher !== 'all') {
                                orConditions.push(`publisher = ?`);
                                whereParams.push(publisher);
                            }
                            
                            // Add category filters if specified
                            if (categories.length > 0) {
                                const categoryConditions = categories.map(() => 'category = ?');
                                orConditions.push(`(${categoryConditions.join(' OR ')})`);
                                whereParams.push(...categories);
                            }
                            
                            // Add element filters if specified
                            if (elements.length > 0) {
                                const elementConditions = elements.map(() => 'element = ?');
                                orConditions.push(`(${elementConditions.join(' OR ')})`);
                                whereParams.push(...elements);
                            }
                            
                            // Add search conditions if we have a search term
                            if (searchPatterns.length > 0) {
                                // Priority 1: Exact phrase match
                                searchableColumns.forEach(colName => {
                                    orConditions.push(`(LOWER(\`${colName}\`) LIKE LOWER(?) AND 1)`);
                                    whereParams.push(searchPattern);
                                });
                                
                                // Priority 2: All words in any order
                                searchableColumns.forEach(colName => {
                                    orConditions.push(`(LOWER(\`${colName}\`) LIKE LOWER(?) AND 2)`);
                                    whereParams.push(searchPatterns[1]);
                                });
                                
                                // Priority 3: Individual words
                                searchPatterns.slice(2).forEach(pattern => {
                                    searchableColumns.forEach(colName => {
                                        orConditions.push(`(LOWER(\`${colName}\`) LIKE LOWER(?) AND 3)`);
                                        whereParams.push(pattern);
                                    });
                                });
                            }
                            
                            // If we only have filters, we need at least one condition
                            if (orConditions.length === 0) {
                                orConditions.push('1=1'); // Always true condition
                            }
                            
                            const whereClause = orConditions.join(' AND ');
                            
                            // Complete SQL fragment for this table
                            const sqlFragment = `${selectClause} FROM \`${tableName}\` WHERE ${whereClause}`;
                            
                            return {
                                valid: true,
                                sqlFragment,
                                params: whereParams
                            };
                        } catch (err) {
                            console.error(`Error constructing SQL for table ${table.tableName}:`, err);
                            return { valid: false };
                        }
                    };
                    
                    // Build count query parts to get total matching items
                    let countQueryParts = [];
                    let countQueryParams = [];
                    
                    searchableTables.forEach(table => {
                        const columns = table.columns || [];
                        const result = constructSafeSQL(table, columns, true); // isCountQuery = true
                        if (result.valid) {
                            countQueryParts.push(result.sqlFragment);
                            countQueryParams = countQueryParams.concat(result.params);
                        }
                    });
                    
                    if (countQueryParts.length === 0) {
                        console.log('No valid count queries could be constructed');
                        return res.json({ 
                            success: true, 
                            items: [], 
                            page: page, 
                            limit: limit, 
                            total: 0, 
                            totalPages: 0 
                        });
                    }
                    
                    // Execute count query to get total matching items
                    const countQuery = `SELECT SUM(count) AS total FROM (${countQueryParts.join(' UNION ALL ')}) AS counts`;
                    console.log('Count query:', countQuery);
                    
                    db.query(countQuery, countQueryParams, (err, countResult) => {
                        if (err) {
                            console.error('Error counting search results:', err);
                            return res.status(500).json({ 
                                success: false, 
                                message: 'Error counting search results',
                                error: err.message
                            });
                        }
                        
                        const totalItems = countResult[0].total || 0;
                        const totalPages = Math.ceil(totalItems / limit);
                        console.log(`Total items: ${totalItems}, Total pages: ${totalPages}`);
                        
                        // If no items found or requested page is beyond available pages
                        if (totalItems === 0 || (page > totalPages && totalPages > 0)) {
                            return res.json({
                                success: true,
                                items: [],
                                page: page,
                                limit: limit,
                                total: totalItems,
                                totalPages: totalPages
                            });
                        }
                        
                        // Now build and execute the main query for the requested page
                        let itemsQueryParts = [];
                        let itemsQueryParams = [];
                        
                        searchableTables.forEach(table => {
                            const columns = table.columns || [];
                            const result = constructSafeSQL(table, columns, false); // isCountQuery = false
                            if (result.valid) {
                                itemsQueryParts.push(result.sqlFragment);
                                itemsQueryParams = itemsQueryParams.concat(result.params);
                            }
                        });
                        
                        if (itemsQueryParts.length === 0) {
                            console.log('No valid item queries could be constructed');
                            return res.json({ 
                                success: true, 
                                items: [], 
                                page: page, 
                                limit: limit, 
                                total: totalItems, 
                                totalPages: totalPages 
                            });
                        }
                        
                        const itemsQuery = itemsQueryParts.join(' UNION ALL ') + ' ORDER BY title LIMIT ? OFFSET ?';
                        itemsQueryParams.push(limit, offset);
                        
                        db.query(itemsQuery, itemsQueryParams, (err, rows) => {
                            if (err) {
                                console.error('Error searching items:', err);
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Error searching database',
                                    error: err.message
                                });
                            }
                            
                            console.log(`Found ${rows.length} items for page ${page}`);
                            
                            res.json({
                                success: true,
                                items: rows,
                                page: page,
                                limit: limit,
                                total: totalItems,
                                totalPages: totalPages
                            });
                        });
                    });
                })
                .catch(error => {
                    console.error('Error checking table structures:', error);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error checking table structures',
                        error: error.message 
                    });
                });
        });
    } catch (error) {
        console.error('Unexpected error in search route:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred',
            error: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;
