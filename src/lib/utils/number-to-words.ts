/**
 * Convert numbers to words for better TTS pronunciation
 * Supports French and English
 */

const ONES_FR = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const TENS_FR = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
const TEENS_FR = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

const ONES_EN = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const TENS_EN = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const TEENS_EN = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

function numberToWordsFR(num: number): string {
  if (num === 0) return 'zéro';
  if (num < 0) return 'moins ' + numberToWordsFR(-num);

  let words = '';

  // Millions
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    words += (millions === 1 ? 'un million' : numberToWordsFR(millions) + ' millions');
    num %= 1000000;
    if (num > 0) words += ' ';
  }

  // Thousands
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    if (thousands === 1) {
      words += 'mille';
    } else {
      words += numberToWordsFR(thousands) + ' mille';
    }
    num %= 1000;
    if (num > 0) words += ' ';
  }

  // Hundreds
  if (num >= 100) {
    const hundreds = Math.floor(num / 100);
    if (hundreds === 1) {
      words += 'cent';
    } else {
      words += ONES_FR[hundreds] + ' cent';
    }
    num %= 100;
    if (num > 0) {
      words += ' ';
    } else if (hundreds > 1) {
      words += 's'; // cents
    }
  }

  // Tens and ones
  if (num >= 20) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;

    if (tens === 7 || tens === 9) {
      // Special cases: 70-79, 90-99
      words += TENS_FR[tens === 7 ? 6 : 8];
      if (ones > 0) {
        const teenIndex = (tens === 7 ? 10 : 10) + ones;
        if (teenIndex >= 10 && teenIndex < 20) {
          words += '-' + TEENS_FR[teenIndex - 10];
        }
      }
    } else if (tens === 8) {
      // 80-89
      words += 'quatre-vingt';
      if (ones > 0) {
        words += '-' + ONES_FR[ones];
      } else {
        words += 's'; // quatre-vingts
      }
    } else {
      words += TENS_FR[tens];
      if (ones === 1 && tens !== 8) {
        words += ' et un';
      } else if (ones > 0) {
        words += '-' + ONES_FR[ones];
      }
    }
  } else if (num >= 10) {
    words += TEENS_FR[num - 10];
  } else if (num > 0) {
    words += ONES_FR[num];
  }

  return words.trim();
}

function numberToWordsEN(num: number): string {
  if (num === 0) return 'zero';
  if (num < 0) return 'minus ' + numberToWordsEN(-num);

  let words = '';

  // Millions
  if (num >= 1000000) {
    words += numberToWordsEN(Math.floor(num / 1000000)) + ' million';
    num %= 1000000;
    if (num > 0) words += ' ';
  }

  // Thousands
  if (num >= 1000) {
    words += numberToWordsEN(Math.floor(num / 1000)) + ' thousand';
    num %= 1000;
    if (num > 0) words += ' ';
  }

  // Hundreds
  if (num >= 100) {
    words += ONES_EN[Math.floor(num / 100)] + ' hundred';
    num %= 100;
    if (num > 0) words += ' ';
  }

  // Tens and ones
  if (num >= 20) {
    words += TENS_EN[Math.floor(num / 10)];
    if (num % 10 > 0) {
      words += '-' + ONES_EN[num % 10];
    }
  } else if (num >= 10) {
    words += TEENS_EN[num - 10];
  } else if (num > 0) {
    words += ONES_EN[num];
  }

  return words.trim();
}

/**
 * Convert currency amount to words
 * e.g., 1933 -> "mille neuf cent trente-trois euros" (FR)
 * e.g., 1933 -> "one thousand nine hundred thirty-three euros" (EN)
 */
export function currencyToWords(amount: number, language: 'fr' | 'en' = 'fr'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const euros = Math.floor(absAmount);
  const cents = Math.round((absAmount - euros) * 100);

  let result = '';

  if (language === 'fr') {
    result = numberToWordsFR(euros);
    if (euros === 0 || euros === 1) {
      result += ' euro';
    } else {
      result += ' euros';
    }

    if (cents > 0) {
      result += ' et ' + numberToWordsFR(cents);
      result += cents === 1 ? ' centime' : ' centimes';
    }
  } else {
    result = numberToWordsEN(euros);
    result += euros === 1 ? ' euro' : ' euros';

    if (cents > 0) {
      result += ' and ' + numberToWordsEN(cents);
      result += cents === 1 ? ' cent' : ' cents';
    }
  }

  if (isNegative) {
    result = (language === 'fr' ? 'moins ' : 'minus ') + result;
  }

  return result;
}

/**
 * Convert regular number to words
 */
export function numberToWords(num: number, language: 'fr' | 'en' = 'fr'): string {
  return language === 'fr' ? numberToWordsFR(num) : numberToWordsEN(num);
}

/**
 * Clean up text for TTS (fallback - LLM should handle most conversions)
 * Just removes symbols and handles edge cases
 */
export function prepareTextForTTS(text: string, language: 'fr' | 'en' = 'fr'): string {
  // If the LLM missed currency symbols, convert them as fallback
  let result = text.replace(/€\s*([0-9,]+(?:\.[0-9]{2})?)|([0-9,]+(?:\.[0-9]{2})?)\s*€/g, (match, amount1, amount2) => {
    const amountStr = (amount1 || amount2).replace(/,/g, '');
    const amount = parseFloat(amountStr);
    return currencyToWords(amount, language);
  });

  return result;
}
