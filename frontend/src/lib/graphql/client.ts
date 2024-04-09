// src/client.js 处理graphql接口请求
import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: '/graphql',
  // uri: 'http://149.104.18.64/graphql',
  cache: new InMemoryCache(),
});

export default client;