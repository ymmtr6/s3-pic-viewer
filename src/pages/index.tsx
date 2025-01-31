import { useEffect, useState } from 'react';
import { Box, Heading, Spinner, Button, Flex, SimpleGrid, createListCollection } from '@chakra-ui/react';
import Image from 'next/image';
import Modal from 'react-modal';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import Head from 'next/head';
import Link from 'next/link';
import { FaXTwitter } from 'react-icons/fa6';

Modal.setAppElement('#__next');

const customStyles = {
  content: {
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    margin: '0',
    padding: '0',
    border: 'none',
    borderRadius: '0',
    overflow: 'hidden',
  },
};

const Home = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(32);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const itemsPerPageOptions = createListCollection({
    items: [
      { value: 16 },
      { value: 32 },
      { value: 64 },
      { value: 128 }
    ]}); // 選択肢を定義
  const currentFiles = files.slice(indexOfFirstItem, indexOfLastItem);

  const nextPage = () => setCurrentPage((prev) => prev + 1);
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const openModal = (file: any) => {
    setSelectedImage(file);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedImage(null);
  };

  const imageUrl = (file: any) => `/api/p/${encodeURIComponent(file.Key)}`;

  const xUrl = (user: string, id: string) => `https://x.com/${user}/status/${id}`

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/listFiles');
      const data = await response.json();
      if (Array.isArray(data)) {
        // Sort files by LastModified date in descending order
        const sortedFiles = data.sort((a, b) => new Date(b.LastModified).getTime() - new Date(a.LastModified).getTime());
        setFiles(sortedFiles);
      } else {
        console.error('Unexpected response format:', data);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    if (page) {
      setCurrentPage(Number(page)); // クエリパラメータからページを取得
    }
    fetchFiles();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0); // ページトップにスクロール
    const url = new URL(window.location.href);
    url.searchParams.set('page', currentPage.toString());
    window.history.replaceState({}, '', url); // URLを更新
  }, [currentPage]);

  const handleModalClick = (event: React.MouseEvent) => {
    const { clientX, currentTarget } = event;
    const { offsetWidth } = currentTarget as HTMLElement;
    const currentIndex = files.findIndex(file => file.Key === selectedImage.Key);
    if (clientX < offsetWidth / 2) {
      const prevIndex = Math.max(currentIndex - 1, 0);
      setSelectedImage(files[prevIndex]);
    } else {
      const nextIndex = Math.min(currentIndex + 1, files.length - 1);
      setSelectedImage(files[nextIndex]);
    }
  };

  return (
    <>
      <Head>
        <title>S3 Bucket Image Viewer</title>
      </Head>
      {!modalIsOpen && (
        <Box as="header" position="fixed" top="0" left="0" width="100%" color="white" bg="gray.800" zIndex="1000" p={1} boxShadow="md">
          <Flex justifyContent="space-between" alignItems="center" width="100%">
            <Heading mb={0} pl={2}>S3 Bucket Image Viewer</Heading>
            <select
              value={itemsPerPage} // 変更点
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value)); // 変更点
              }}
              style={{ backgroundColor: 'gray.800', color: 'white' }} // 背景色と文字色を設定
            >
              {itemsPerPageOptions.items.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.value}
                </option>
              ))}
            </select>
          </Flex>
        </Box>
      )}
      <Box p={5} pt={modalIsOpen ? "0" : "64px"}>
        {loading ? (
          <Spinner />
        ) : (
          <SimpleGrid columns={[2, 3, 4]} gridGap="5px">
            {currentFiles.map((file, index) => (
              <Box key={index} display="flex" justifyContent="center" alignItems="center" overflow="hidden" height="300px" onClick={() => openModal(file)}>
                {file.Key && (
                  <Image
                    src={imageUrl(file)}
                    alt={file.Key}
                    width={300}
                    height={300}
                    style={{ objectFit: 'contain', width: '100%', height: '100%' }} // 変更点
                    priority={true}
                  />
                )}
              </Box>
            ))}
          </SimpleGrid>
        )}
        <Flex
          position="fixed"
          bottom="10px"
          left="50%"
          transform="translateX(-50%)"
          justifyContent={currentPage === 1 ? 'flex-end' : 'space-between'}
          width="80%"
        >
          <Button onClick={prevPage} disabled={currentPage === 1} display={currentPage === 1 ? 'none' : 'inline-flex'}>
            <FaArrowLeft />
          </Button>
          <Button onClick={nextPage} disabled={indexOfLastItem >= files.length} display={indexOfLastItem >= files.length ? 'none' : 'inline-flex'}>
            <FaArrowRight />
          </Button>
        </Flex>
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="Image Modal"
          style={customStyles}
          shouldCloseOnOverlayClick={true}
        >
          {selectedImage && <>
            <Box position="relative" width="100%" height="100%" bg="black" onClick={handleModalClick}>
              <Image
                src={imageUrl(selectedImage)}
                alt="Selected Image"
                fill
                style={{ objectFit: 'contain' }}
                priority={true}
                quality={100}
              />
            </Box>
            {selectedImage.Key?.split('/').length == 3 &&
              <Box position="absolute" bottom="20px" right="20px">
                <Link href={xUrl(selectedImage.Key.split('/')[0], selectedImage.Key.split('/')[1])} target="_blank" rel="noopener noreferrer">
                  <FaXTwitter />
                </Link>
              </Box>
            }
          </>}
          <Button onClick={closeModal} position="absolute" top="10px" right="10px">Close</Button>
        </Modal>
      </Box>
    </>
  );
};

export default Home;
