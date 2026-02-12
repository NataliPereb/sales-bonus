/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const { discount, sale_price, quantity} = purchase;
   
   // Коэфициент без расчета суммы в десяиичном фоомате
   const discountCoefficient = 1 - (purchase.discount / 100)

   // Выручка
   return sale_price * quantity * discountCoefficient
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;

    if (index === 0) {
        return 0.15
    } else if (index === 1 || index === 2) {
        return 0.1
    } else if (index === total - 1) {
        return 0
    } else {
        return 0.05
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus } = options;

    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
        || !Array.isArray(data.customers)
        || data.sellers.length === 0
        || data.products.length === 0
        || data.purchase_records.length === 0
        || data.customers.length === 0
    ) {
        throw new Error('Некорректные данные');
    } 

    // @TODO: Проверка наличия опций
    if (typeof options !== "object" || typeof calculateRevenue !== "function" || typeof calculateBonus !== "function") {
        throw new Error('Чего-то не хватает');
    } 
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }) )

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const productIndex = data.products.reduce((result, product) => {
        const key = product.sku;

        result[key] = product;
        return result
    }, {})

    const sellerIndex= sellerStats.reduce((result, seller) => {
        const key = seller.id;
        
        result[key] = seller
        return result
    }, {})

     
    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        // Получили индекс продавца
        const seller = sellerIndex[record.seller_id];

        if (!seller) {
            console.log(`Продавец с ${record.seller_id} не найден для чека ${record.receipt_id}`)
        }

        // Увеличить число продаж на 1
        seller.sales_count += 1;

        // Увеличить общую сумму выручки на сумму чека
        seller.revenue += record.total_amount

        
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // ТОвар 

            if (!product) {
                console.log(`Товар с SKU ${item.sku} не найден для чека ${record.receipt_id}`)
            }

            //Посчитать себестоимость
            const cost = product.purchase_price * item.quantity

            // Посчитать выручку 
            const itemRevenue = calculateRevenue(item, product)

            //Посчитать прибыль: выручка минус себестоимость
            const itemProfit = itemRevenue - cost

            //Увеличить общую накопленную прибыль у продавца
            seller.profit += itemProfit

            // Учет количества проданных товаров 
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0
            }
            
            // по артикулу товара увеличть его проданное количество у продавца
            seller.products_sold[item.sku] += item.quantity;

        })
    });
    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort((sellerA, sellerB) => sellerB.profit - sellerA.profit)

    // @TODO: Назначение премий на основе ранжирования

    sellerStats.forEach((seller, index) => {

        const bonusPercent = calculateBonus(index, sellerStats.length, seller);
        seller.bonus = seller.profit * bonusPercent;

        // Формирование топ 10 товаров
        seller.top_products = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({
            sku: sku,
            quantity: quantity
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    })

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
     }));
    
}