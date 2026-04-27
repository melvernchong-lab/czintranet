// utils/parsers/index.js
import { MSProjectParser } from './msProjectParser.js'
import { ExcelParser } from './excelParser.js'
import { CSVParser } from './csvParser.js'
import { JSONParser } from './jsonParser.js'

export class ParserFactory {
  static getParser(type) {
    switch (type) {
      case 'ms-project':
        return MSProjectParser
      case 'excel':
        return ExcelParser
      case 'csv':
        return CSVParser
      case 'json':
        return JSONParser
      default:
        throw new Error(`Unsupported parser type: ${type}`)
    }
  }
  
  static async parseFile(type, file) {
    const Parser = this.getParser(type)
    return await Parser.parse(file)
  }
}