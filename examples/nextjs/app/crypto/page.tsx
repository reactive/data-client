import AssetPrice from '@/components/AssetPrice';
import styles from '@/styles/Home.module.css';

export const dynamic = 'force-dynamic';

export default function Crypto() {
  return (
    <>
      <title>Live Crypto Prices with Reactive Data Client</title>
      <meta
        name="description"
        content="Live BTC price using the Reactive Data Client"
      />

      <p className={styles.price}>
        <AssetPrice symbol="BTC" />
      </p>
    </>
  );
}
