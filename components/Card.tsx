import styles from "@/css/Card.module.scss";

const Card = ({ children, cardClass }: { children: React.ReactNode; cardClass?: string }) => {
  return <div className={`${styles.card} ${cardClass}`}>{children}</div>;
};

export default Card;
