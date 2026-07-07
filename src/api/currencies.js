import client from './client'

export const getCurrencies = () => client.get('/currencies')
